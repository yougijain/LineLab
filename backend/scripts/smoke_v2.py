"""Smoke-test the v2 backend additions: seed override, /api/project, health flag."""

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

STATE = {
    "stage": "midgame", "hp": 58, "gold": 42, "level": 6, "board_strength": "weak",
    "bench_value": "medium", "pairs": 2, "items": "medium", "lobby_tempo": "high",
    "goal": "top4",
}

h = c.get("/api/health").json()
print("health:", {k: h[k] for k in ("scenario_store", "chat_coach")})

# Deterministic vs fresh seed
a = c.post("/api/compare", json={"state": STATE, "n_rollouts": 800}).json()
b = c.post("/api/compare", json={"state": STATE, "n_rollouts": 800, "seed": 777}).json()
d = c.post("/api/compare", json={"state": STATE, "n_rollouts": 800, "seed": 999}).json()
print(f"default seed={a['seed']} best={a['best_key']} top4={a['results'][0]['top4_rate']:.3f}")
print(f"seed=777  best={b['best_key']} top4={b['results'][0]['top4_rate']:.3f}")
print(f"seed=999  best={d['best_key']} top4={d['results'][0]['top4_rate']:.3f}")
print("seed override changes sampling:", b["results"][0]["top4_rate"] != d["results"][0]["top4_rate"])

# Projection
p = c.post("/api/project", json={"state": STATE, "n_rollouts": 1500}).json()
print(f"\nproject line: {p['line_label']}  final={p['final_placement']}  top4={p['top4_rate']:.2f}")
print("watch_next:", p["watch_next"][:90])
print(f"{'stage':>6}{'surv%':>8}{'expHP':>8}{'str/lobby':>11}{'place':>8}")
for s in p["trajectory"]:
    print(f"{s['stage']:>6}{s['survival']*100:>7.0f}%{s['exp_hp']:>8.0f}{s['strength_vs_lobby']:>11.2f}{s['exp_placement']:>8.2f}")
print("\nOK")
