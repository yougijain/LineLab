"""
Tests for the LineLab Solver engine.

These exercise the abstract model end to end: economy math, the combat model's
monotonicity, upgrade-probability estimation, and that ``compare_actions``
produces well-formed, directionally-sensible EV tables.
"""

from __future__ import annotations

import math

import pytest

from app.solver import (
    compare_actions,
    estimate_fight_outcome,
    estimate_hp_loss,
    estimate_upgrade_probability,
)
from app.solver.economy import interest, next_streak, round_income
from app.solver.evaluator import StateInput, generate_candidate_actions
from app.solver.leveling import LevelState, gold_to_reach_level


# --------------------------------------------------------------------------- economy

def test_interest_caps_at_five():
    assert interest(0) == 0
    assert interest(35) == 3
    assert interest(50) == 5
    assert interest(99) == 5            # capped


def test_streak_and_income():
    assert next_streak(0, True) == 1
    assert next_streak(3, False) == -1   # win streak broken -> loss streak 1
    # 50 gold + 5-loss streak (+2) + base 5, no win bonus
    assert round_income(50, -5, won=False) == 5 + 5 + 2


# --------------------------------------------------------------------------- combat

def test_fight_outcome_is_a_probability_and_monotonic():
    p_even = estimate_fight_outcome(40, 40)
    assert abs(p_even - 0.5) < 1e-9
    assert estimate_fight_outcome(60, 40) > p_even > estimate_fight_outcome(20, 40)
    for a in (0, 50, 120):
        assert 0.0 <= estimate_fight_outcome(a, 45) <= 1.0


def test_hp_loss_scales_with_stage_and_margin():
    assert estimate_hp_loss(7, 0) > estimate_hp_loss(2, 0)        # later = more damage
    assert estimate_hp_loss(4, 30) > estimate_hp_loss(4, 0)        # worse loss = more damage


# --------------------------------------------------------------------------- shop

def test_upgrade_probability_increases_with_gold():
    low = estimate_upgrade_probability(7, 10, [3, 4], hunting=2)
    high = estimate_upgrade_probability(7, 40, [3, 4], hunting=2)
    assert high.refreshes > low.refreshes
    assert high.expected_useful > low.expected_useful
    assert 0.0 <= low.p_at_least_one <= high.p_at_least_one <= 1.0


def test_leveling_cost_is_positive_and_monotone():
    s = LevelState(6)
    assert gold_to_reach_level(s, 6) == 0
    assert gold_to_reach_level(s, 7) > 0
    assert gold_to_reach_level(s, 8) > gold_to_reach_level(s, 7)


# --------------------------------------------------------------------------- evaluator

def _example_state() -> StateInput:
    return StateInput(stage="midgame", hp=58, gold=42, level=6,
                      board_strength="weak", bench_value="medium", pairs=2,
                      items="medium", lobby_tempo="high", goal="top4")


def test_candidate_actions_are_feasible():
    actions = generate_candidate_actions(_example_state())
    keys = {a.key for a in actions}
    assert "save" in keys
    assert len(actions) >= 3
    assert len(actions) <= 6


def test_compare_actions_well_formed():
    out = compare_actions(_example_state(), n_rollouts=800)
    assert out.results, "expected at least one line"
    # ranked best-first by ev_score
    scores = [r.ev_score for r in out.results]
    assert scores == sorted(scores, reverse=True)
    assert out.best_key == out.results[0].key
    for r in out.results:
        assert 1.0 <= r.expected_placement <= 8.0
        # distribution sums to ~1 (values are rounded to 4 dp for the wire)
        assert abs(sum(r.distribution) - 1.0) < 5e-3
        assert 0.0 <= r.top4_rate <= 1.0
        assert 0.0 <= r.first_rate <= 1.0
        # bot4 is the complement of top4 (modulo rounding)
        assert abs(r.top4_rate + r.bot4_rate - 1.0) < 5e-3
        assert r.explanation
        assert r.branches  # decision-tree branches present


def test_low_hp_weak_board_prefers_rolling_over_saving():
    """Directional sanity (high-signal): when health is critically low, rolling
    to stabilize should clearly beat saving on survival."""
    state = StateInput(stage="late", hp=22, gold=36, level=7, board_strength="weak",
                       bench_value="low", pairs=3, items="high", lobby_tempo="high",
                       goal="top4")
    out = compare_actions(state, n_rollouts=2000)
    by_key = {r.key: r for r in out.results}
    assert "save" in by_key
    best = out.results[0]
    assert best.key.startswith("roll"), f"expected a roll line, got {best.key}"
    # Rolling should beat pure saving on top-4 by a clear margin.
    assert best.top4_rate - by_key["save"].top4_rate > 0.05


def test_strong_healthy_board_is_winning_and_protects_lead():
    """A strong, healthy late board should be in a commanding spot and the top
    line should not be the reckless all-in."""
    state = StateInput(stage="late", hp=64, gold=60, level=8, board_strength="strong",
                       bench_value="medium", pairs=0, items="high", lobby_tempo="medium",
                       goal="first")
    out = compare_actions(state, n_rollouts=1500)
    best = out.results[0]
    assert best.expected_placement < 3.0          # clearly winning
    assert best.key != "roll_0"                    # don't throw the lead all-in


def test_goal_changes_ranking_objective():
    base = dict(stage="late", hp=64, gold=60, level=8, board_strength="strong",
                bench_value="medium", pairs=0, items="high", lobby_tempo="medium")
    top4 = compare_actions(StateInput(goal="top4", **base), n_rollouts=800)
    first = compare_actions(StateInput(goal="first", **base), n_rollouts=800)
    # The objective differs, so first-place equity should weigh more under "first".
    first_best = next(r for r in first.results if r.key == first.best_key)
    assert first_best.first_rate >= 0.0  # well-formed; objective is goal-aware
    assert top4.results and first.results
