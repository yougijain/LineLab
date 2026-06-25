"""
Post-game "Line Review" grading.

Grades a sequence of macro decisions from a played game against the solver,
chess.com-style but with original labels (Keystone -> Misline). For each
decision we run the solver on the pre-decision state, locate the line the player
actually took, and score the expected-value gap vs the best line.

All thresholds come from the design pass (docs/design-game.md). The grading
logic lives server-side so the same rules back the live coach and the review.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from .models import GameState, MoveGrade, ReviewDecision, ReviewResponse
from .solver import compare_actions
from .solver.evaluator import LineResult, StateInput


# Original label scale (name, meaning, hex). Order matters: first match wins,
# but trap/forced are checked before the loss bands.
@dataclass
class Label:
    name: str
    meaning: str
    color: str


LBL_KEYSTONE = Label("Keystone", "Found the clearly-best line in a trap spot", "#34d399")
LBL_PURE = Label("Pure Line", "Hit the only acceptable line in a forced spot", "#5eead4")
LBL_OPTIMAL = Label("Optimal", "Best (or tied-best) line", "#4ade80")
LBL_SOLID = Label("Solid", "Clearly fine, near-best", "#a3e635")
LBL_LOOSE = Label("Loose", "Playable but leaks a little EV", "#facc15")
LBL_SLIP = Label("Slip", "Real mistake — a better line was clear", "#fb923c")
LBL_MISLINE = Label("Misline", "Punishing error that griefs the spot", "#f87171")

BANDS = [
    (95, "Surgical"), (87, "Refined"), (75, "Sharp"), (60, "Steady"), (0, "Developing"),
]


def _to_state_input(state: GameState) -> StateInput:
    return StateInput(
        stage=state.stage, hp=state.hp, gold=state.gold, level=state.level,
        board_strength=state.board_strength, bench_value=state.bench_value,
        pairs=state.pairs, items=state.items, lobby_tempo=state.lobby_tempo,
        goal=state.goal,
    )


def _floor_of(key: str) -> Optional[int]:
    if key.startswith("roll_"):
        try:
            return int(key.split("_")[1])
        except (ValueError, IndexError):
            return None
    return None


def _locate(results: List[LineResult], action_key: str) -> LineResult:
    """Find the played line; fall back to the nearest roll floor, else worst."""
    by_key = {r.key: r for r in results}
    if action_key in by_key:
        return by_key[action_key]
    target = _floor_of(action_key)
    if target is not None:
        rolls = [r for r in results if _floor_of(r.key) is not None]
        if rolls:
            return min(rolls, key=lambda r: abs(_floor_of(r.key) - target))
    # Unknown line: grade as the worst available (a real miss).
    return min(results, key=lambda r: r.ev_score)


def _grade_one(index: int, dec: ReviewDecision, n_rollouts: int) -> tuple[MoveGrade, float, GameState]:
    state_in = _to_state_input(dec.state)
    out = compare_actions(state_in, n_rollouts=n_rollouts)
    results = out.results
    best = next(r for r in results if r.key == out.best_key)
    played = _locate(results, dec.action_key)

    ev_max = 12.0 if dec.state.goal == "first" else 5.0
    gap_ev = max(0.0, (best.ev_score - played.ev_score) / ev_max)
    gap_place = max(0.0, played.expected_placement - best.expected_placement)
    loss = 0.70 * gap_ev + 0.30 * min(1.0, gap_place / 2.0)

    played_is_best = played.key == best.key

    # Trap: best is much better than the "obvious/lazy" save/level lines.
    obvious = [r for r in results if r.key != best.key and
               (r.key.startswith("save") or r.key.startswith("level"))]
    tempting = max((r.ev_score for r in obvious), default=best.ev_score)
    trap_gap = (best.ev_score - tempting) / ev_max
    is_trap = played_is_best and trap_gap >= 0.12

    # Forced: every alternative loses a lot, so only one line is acceptable.
    alt_losses = []
    for r in results:
        if r.key == best.key:
            continue
        g_ev = max(0.0, (best.ev_score - r.ev_score) / ev_max)
        g_pl = max(0.0, r.expected_placement - best.expected_placement)
        alt_losses.append(0.70 * g_ev + 0.30 * min(1.0, g_pl / 2.0))
    is_forced = played_is_best and bool(alt_losses) and min(alt_losses) >= 0.18

    if is_trap:
        label, quality = LBL_KEYSTONE, 100
    elif is_forced:
        label, quality = LBL_PURE, 100
    elif loss <= 0.02:
        label = LBL_OPTIMAL
    elif loss <= 0.06:
        label = LBL_SOLID
    elif loss <= 0.14:
        label = LBL_LOOSE
    elif loss <= 0.28:
        label = LBL_SLIP
    else:
        label = LBL_MISLINE
    if label not in (LBL_KEYSTONE, LBL_PURE):
        quality = round(100 * (1 - loss))

    grade = MoveGrade(
        index=index,
        stage_round=dec.stage_round or f"{state_in.stage_number()}-?",
        played_key=played.key, played_label=played.label,
        best_key=best.key, best_label=best.label,
        gap_ev=round(gap_ev, 4), gap_place=round(gap_place, 3), loss=round(loss, 4),
        quality=quality, label_name=label.name, label_meaning=label.meaning,
        label_color=label.color, is_trap=is_trap, is_forced=is_forced,
    )
    return grade, loss, dec.state


def _leak(decisions: List[ReviewDecision], losses: List[float]) -> str:
    """Name the player's biggest recurring leak by (phase, line-family) weight."""
    buckets: dict[str, float] = {}
    msg = {
        "early-save": "Greedy early — bled HP holding gold.",
        "mid-level": "Weak midgame stabilization — leveled when the board needed strength.",
        "mid-roll": "Slow to roll — sat on gold past the stabilize window.",
        "late-roll0": "Over-rolled the endgame — all-in'd a spot that wanted level/econ.",
        "other": "Solid macro overall — no single dominant leak.",
    }
    for dec, loss in zip(decisions, losses):
        stage = dec.state.stage
        phase = "early" if stage == "early" else ("mid" if stage == "midgame" else "late")
        k = dec.action_key
        fam = "roll0" if k.startswith("roll_0") else (
            "roll" if k.startswith("roll") else (
                "level" if k.startswith("level") else "save"))
        key = f"{phase}-{fam}"
        if key not in msg:
            key = "other"
        weight = {"early": 2, "midgame": 4, "late": 6}.get(stage, 4)
        buckets[key] = buckets.get(key, 0.0) + weight * loss
    if not buckets or max(buckets.values()) < 0.05:
        return msg["other"]
    worst = max(buckets, key=buckets.get)
    return msg.get(worst, msg["other"])


def review_game(decisions: List[ReviewDecision], n_rollouts: int) -> ReviewResponse:
    grades: List[MoveGrade] = []
    losses: List[float] = []
    weights: List[int] = []
    worst_idx, worst_loss = 0, -1.0

    for i, dec in enumerate(decisions):
        grade, loss, _ = _grade_one(i, dec, n_rollouts)
        grades.append(grade)
        losses.append(loss)
        weights.append({"early": 2, "midgame": 4, "late": 6}.get(dec.state.stage, 4))
        if loss > worst_loss:
            worst_loss, worst_idx = loss, i

    # Stage-weighted accuracy.
    if grades:
        num = sum(w * g.quality for w, g in zip(weights, grades))
        den = sum(weights) or 1
        accuracy = max(0, min(100, round(num / den)))
    else:
        accuracy = 100
    band = next(name for cut, name in BANDS if accuracy >= cut)

    return ReviewResponse(
        grades=grades,
        accuracy=accuracy,
        band=band,
        main_leak=_leak(decisions, losses),
        study_index=worst_idx,
    )
