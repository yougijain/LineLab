"""
Calibration harness — prints EV tables for representative scenarios so the
abstract model can be eyeballed and tuned. Run from backend/:

    .venv/Scripts/python.exe scripts/calibrate.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.solver import compare_actions
from app.solver.evaluator import StateInput

SCENARIOS = {
    "Weak midgame, pressured, fast lobby (top4)": StateInput(
        stage="midgame", hp=58, gold=42, level=6, board_strength="weak",
        bench_value="medium", pairs=2, items="medium", lobby_tempo="high", goal="top4"),
    "Medium midgame, even (top4)": StateInput(
        stage="midgame", hp=65, gold=44, level=6, board_strength="medium",
        bench_value="medium", pairs=1, items="medium", lobby_tempo="medium", goal="top4"),
    "Strong late, healthy (first)": StateInput(
        stage="late", hp=64, gold=60, level=8, board_strength="strong",
        bench_value="medium", pairs=0, items="high", lobby_tempo="medium", goal="first"),
    "Low HP late, weak (top4)": StateInput(
        stage="late", hp=22, gold=36, level=7, board_strength="weak",
        bench_value="low", pairs=3, items="high", lobby_tempo="high", goal="top4"),
    "Healthy early streak (first)": StateInput(
        stage="early", hp=88, gold=50, level=5, board_strength="medium",
        bench_value="high", pairs=1, items="medium", lobby_tempo="medium", goal="first"),
}


def main() -> None:
    for title, state in SCENARIOS.items():
        out = compare_actions(state, n_rollouts=4000)
        print("\n" + "=" * 86)
        print(title, f"   [best: {out.best_key}]")
        print("-" * 86)
        print(f"{'line':<26}{'avg':>6}{'top4':>8}{'first':>8}{'bot4':>8}{'risk':>7}  explanation")
        for r in out.results:
            print(f"{r.label:<26}{r.expected_placement:>6.2f}"
                  f"{r.top4_rate*100:>7.0f}%{r.first_rate*100:>7.0f}%{r.bot4_rate*100:>7.0f}%"
                  f"{r.risk:>7.2f}  {r.explanation[:46]}")
    print()


if __name__ == "__main__":
    main()
