"""
Verify the Supabase Postgres connection end-to-end.

Reads SUPABASE_DB_URL from backend/.env, then does a full round-trip against the
scenarios store: ensure schema/seed, list, insert a temp row, re-list, delete.

    .venv/Scripts/python.exe scripts/check_db.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:  # make non-ASCII output safe on Windows (cp1252) consoles
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from app import scenarios
from app import db
from app.models import GameState


def main() -> int:
    if not db.is_enabled():
        print("SUPABASE_DB_URL is not set (or psycopg missing) — backend will use the")
        print("JSON fallback. Paste the Session pooler connection string into backend/.env")
        print("to activate the Supabase store, then re-run this script.")
        return 1

    print("Supabase store ENABLED. Running round-trip…")
    db.ensure_ready(scenarios.BUILTIN)

    before = scenarios.list_scenarios()
    print(f"  list: {len(before)} scenarios "
          f"({sum(s.builtin for s in before)} built-in)")

    saved = scenarios.save_scenario(
        "DB check — temp spot", "inserted by check_db.py",
        GameState(stage="midgame", hp=50, gold=40, level=6, board_strength="medium",
                  bench_value="medium", pairs=1, items="medium", lobby_tempo="medium",
                  goal="top4"),
    )
    print(f"  insert: id={saved.id}")

    after = scenarios.list_scenarios()
    assert any(s.id == saved.id for s in after), "inserted row not found"
    print(f"  list after insert: {len(after)} scenarios")

    ok = scenarios.delete_scenario(saved.id)
    assert ok, "delete failed"
    final = scenarios.list_scenarios()
    assert not any(s.id == saved.id for s in final), "row not deleted"
    print(f"  delete: ok, back to {len(final)} scenarios")

    db.close()
    print("ROUND-TRIP OK -- backend is connected to Supabase.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
