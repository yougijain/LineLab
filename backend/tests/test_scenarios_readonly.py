"""
Regression tests for the JSON scenario store on a read-only filesystem.

Serverless hosts mount the application directory read-only. The store used to
create its data file eagerly on every read, so ``GET /api/scenarios`` raised
``OSError: Read-only file system`` and the endpoint answered 500 — taking the
built-in teaching scenarios down with it. Reads must degrade to the built-ins,
and writes must surface as a 503 the UI can explain.

The read-only condition is simulated by raising ``EROFS`` from the write calls
rather than by chmod, so the tests are meaningful even when run as root (which
bypasses directory permissions) and on filesystems that ignore mode bits.
"""

from __future__ import annotations

import errno
import importlib
import pathlib
import sys

import pytest
from fastapi.testclient import TestClient

STATE = {
    "stage": "midgame", "hp": 58, "gold": 42, "level": 6,
    "board_strength": "weak", "bench_value": "medium", "pairs": 2,
    "items": "medium", "lobby_tempo": "high", "goal": "top4",
}


def _reload_app(data_dir, monkeypatch):
    monkeypatch.setenv("LINELAB_DATA_DIR", str(data_dir))
    for name in [m for m in list(sys.modules) if m.startswith("app")]:
        del sys.modules[name]
    return importlib.import_module("app.main")


@pytest.fixture
def readonly_app(tmp_path, monkeypatch):
    """App whose store directory rejects every write with EROFS."""
    data_dir = tmp_path / "data"
    main = _reload_app(data_dir, monkeypatch)

    def _read_only(self, *args, **kwargs):
        raise OSError(errno.EROFS, "Read-only file system", str(self))

    monkeypatch.setattr(pathlib.Path, "mkdir", _read_only)
    monkeypatch.setattr(pathlib.Path, "write_text", _read_only)

    try:
        yield TestClient(main.app), importlib.import_module("app.scenarios")
    finally:
        for name in [m for m in list(sys.modules) if m.startswith("app")]:
            del sys.modules[name]


def test_listing_scenarios_survives_a_readonly_store(readonly_app):
    client, scenarios = readonly_app

    res = client.get("/api/scenarios")

    assert res.status_code == 200
    body = res.json()
    assert body, "built-in scenarios must still be served"
    assert all(s["builtin"] for s in body)
    assert not scenarios.json_store_writable()


def test_saving_to_a_readonly_store_reports_503_not_500(readonly_app):
    client, _ = readonly_app

    res = client.post(
        "/api/scenarios",
        json={"name": "spot", "description": "d", "state": STATE},
    )

    assert res.status_code == 503
    assert "writable" in res.json()["detail"]


def test_health_reports_the_store_as_unwritable(readonly_app):
    client, _ = readonly_app

    body = client.get("/api/health").json()

    assert body["status"] == "ok"
    assert body["scenario_store"] == "json"
    assert body["scenario_store_writable"] is False


def test_writable_store_round_trips(tmp_path, monkeypatch):
    """The happy path still works when the directory is writable."""
    main = _reload_app(tmp_path / "data", monkeypatch)
    client = TestClient(main.app)

    try:
        res = client.post(
            "/api/scenarios",
            json={"name": "my spot", "description": "d", "state": STATE},
        )
        assert res.status_code == 200
        saved_id = res.json()["id"]

        assert client.get("/api/health").json()["scenario_store_writable"] is True
        assert saved_id in [s["id"] for s in client.get("/api/scenarios").json()]
        assert client.delete(f"/api/scenarios/{saved_id}").status_code == 200
        assert saved_id not in [s["id"] for s in client.get("/api/scenarios").json()]
    finally:
        for name in [m for m in list(sys.modules) if m.startswith("app")]:
            del sys.modules[name]
