"""Smoke-test the /api/review grading endpoint."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)

# A mini "game": a few decisions, some good, some bad.
decisions = [
    # weak/pressured spot but the player SAVED (should grade poorly)
    {"state": {"stage": "midgame", "hp": 40, "gold": 30, "level": 6, "board_strength": "weak",
               "bench_value": "low", "pairs": 2, "items": "medium", "lobby_tempo": "high",
               "goal": "top4"}, "action_key": "save", "action_label": "Save", "stage_round": "4-2"},
    # strong/healthy spot and the player SAVED (correct — don't throw)
    {"state": {"stage": "late", "hp": 64, "gold": 60, "level": 8, "board_strength": "strong",
               "bench_value": "medium", "pairs": 0, "items": "high", "lobby_tempo": "medium",
               "goal": "top4"}, "action_key": "save", "action_label": "Save", "stage_round": "5-1"},
    # low HP, player rolled to 0 (good stabilize)
    {"state": {"stage": "late", "hp": 18, "gold": 30, "level": 7, "board_strength": "weak",
               "bench_value": "low", "pairs": 3, "items": "high", "lobby_tempo": "high",
               "goal": "top4"}, "action_key": "roll_0", "action_label": "Roll to 0", "stage_round": "5-5"},
]

r = c.post("/api/review", json={"decisions": decisions, "n_rollouts": 600})
print("status:", r.status_code)
d = r.json()
print(f"accuracy: {d['accuracy']} ({d['band']})")
print("main leak:", d["main_leak"])
print("worst decision index:", d["study_index"])
for g in d["grades"]:
    print(f"  [{g['stage_round']}] played {g['played_label']:<14} "
          f"-> {g['label_name']:<9} q={g['quality']:>3} "
          f"loss={g['loss']:.3f} (best: {g['best_label']})")
print("OK")
