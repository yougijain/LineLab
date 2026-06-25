"""Quick end-to-end smoke test of the FastAPI app via the test client."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)

print("health:", c.get("/api/health").json())

payload = {
    "state": {
        "stage": "midgame", "hp": 58, "gold": 42, "level": 6,
        "board_strength": "weak", "bench_value": "medium", "pairs": 2,
        "items": "medium", "lobby_tempo": "high", "goal": "top4",
    },
    "n_rollouts": 1200,
}
r = c.post("/api/compare", json=payload)
d = r.json()
print(f"status: {r.status_code}  best: {d['best_key']}  elapsed_ms: {d['elapsed_ms']}  cached: {d['cached']}")
for x in d["results"]:
    print(f"  {x['label']:<28} avg={x['expected_placement']:.2f} "
          f"top4={x['top4_rate'] * 100:.0f}% first={x['first_rate'] * 100:.0f}% "
          f"branches={len(x['branches'])}")
print("summary:", d["summary"][:140], "...")

r2 = c.post("/api/compare", json=payload)
print("second call cached:", r2.json()["cached"])

print("scenarios:", len(c.get("/api/scenarios").json()))
preview = c.get("/api/actions", params={
    "stage": "late", "hp": 22, "gold": 36, "level": 7,
    "board_strength": "weak", "items": "high", "pairs": 3, "lobby_tempo": "high",
}).json()
print("actions preview:", [a["label"] for a in preview])
print("OK")
