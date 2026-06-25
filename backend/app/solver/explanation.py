"""
Explanation engine.

Turns the numbers a rollout produces into short, human-readable rationale — the
kind of one-line "why" a coach would give next to each line, plus an overall
summary of the recommended decision. This is what makes the solver a *teaching*
tool rather than a black box.
"""

from __future__ import annotations

from typing import Dict, List


def _pct(x: float) -> str:
    return f"{round(x * 100)}%"


def explain_line(
    line_key: str,
    label: str,
    metrics: Dict[str, float],
    state: Dict[str, object],
    best_metrics: Dict[str, float],
    is_best: bool,
) -> str:
    """One-line rationale for a single line, blending strategy heuristics with
    how this line compares to the best line on the numbers."""
    hp = int(state["hp"])
    board = str(state["board_strength"])
    goal = str(state["goal"])
    weak = board == "weak"
    low_hp = hp < 45

    base = ""
    if line_key.startswith("save"):
        if weak or low_hp:
            base = "Greedy — banks gold and interest, but risks bleeding out while the board is weak"
        else:
            base = "Preserves economy and interest; fine when the board can coast"
    elif line_key.startswith("level") and "roll" in line_key:
        base = "Balances survival and ceiling — adds a level and digs for upgrades"
    elif line_key.startswith("level"):
        base = "Raises your unit cap and shop odds; helps the ceiling but may not stabilize this turn"
    elif line_key.startswith("roll0") or line_key.endswith("_0"):
        base = "Maximum stabilization now — strongest immediate board, worst long-term economy"
    elif line_key.startswith("roll"):
        base = "Spends gold to find upgrades now; stabilizes the board at some economic cost"
    else:
        base = "Custom line"

    # Data-driven comparison clause.
    delta_top4 = metrics["top4_rate"] - best_metrics["top4_rate"]
    delta_place = metrics["expected_placement"] - best_metrics["expected_placement"]
    if is_best:
        if goal == "first":
            clause = f"best line for first: {_pct(metrics['first_rate'])} win equity"
        else:
            clause = f"best line: {_pct(metrics['top4_rate'])} top-4, avg {metrics['expected_placement']:.1f}"
    else:
        if delta_top4 <= -0.02:
            clause = f"{_pct(abs(delta_top4))} less top-4 than best"
        elif delta_place >= 0.15:
            clause = f"avg placement {delta_place:.1f} worse than best"
        else:
            clause = "close to best — a viable alternative"

    return f"{base} ({clause})."


def summarize(
    best_key: str,
    best_label: str,
    results: List[Dict[str, object]],
    state: Dict[str, object],
    goal: str,
) -> str:
    """A short paragraph explaining the recommended decision in context."""
    best = next(r for r in results if r["key"] == best_key)
    hp = int(state["hp"])
    gold = int(state["gold"])
    stage = str(state["stage"])
    board = str(state["board_strength"])
    tempo = str(state["lobby_tempo"])

    goal_text = "securing a top-4" if goal == "top4" else "playing for first"
    pressure = "under health pressure" if hp < 45 else "with health to spare"
    lobby = "a fast, strong lobby" if tempo == "high" else (
        "a slow lobby" if tempo == "low" else "an even lobby")

    return (
        f"In this {stage} spot {pressure} ({hp} HP, {gold} gold, {board} board) against {lobby}, "
        f"the highest-EV line for {goal_text} is \"{best_label}\": "
        f"{_pct(best['top4_rate'])} top-4, {_pct(best['first_rate'])} first, "
        f"average placement {best['expected_placement']:.1f}. "
        + (
            "Your board is behind the lobby, so converting gold into board strength now buys the time "
            "your economy needs to pay off."
            if board == "weak" else
            "Your board can hold, so the line that best protects economy while keeping your ceiling wins out."
        )
    )
