"""
LineLab Solver — original auto-battler decision-theory engine.

Public surface (the "core functions" of the solver):

  simulate_action(hero_input, plan, n_rollouts, seed)   -> rollout.py
  compare_actions(state, candidate_actions, n_rollouts) -> evaluator.py
  estimate_fight_outcome(board_strength, lobby_strength) -> combat_model.py
  estimate_hp_loss(stage, loss_margin)                  -> combat_model.py
  estimate_upgrade_probability(level, gold, tiers, ...)  -> shop.py
  generate_explanation(...)                              -> explanation.explain_line / summarize

Everything here is an ORIGINAL abstract game model — no Riot/TFT IP.
"""

from .combat_model import estimate_fight_outcome, estimate_hp_loss
from .evaluator import (
    CompareOutput,
    LineResult,
    StateInput,
    compare_actions,
    generate_candidate_actions,
    initial_strength,
)
from .explanation import explain_line as generate_explanation
from .rollout import ActionPlan, HeroInput, simulate_action
from .shop import estimate_upgrade_probability

__all__ = [
    "compare_actions",
    "simulate_action",
    "estimate_fight_outcome",
    "estimate_hp_loss",
    "estimate_upgrade_probability",
    "generate_explanation",
    "generate_candidate_actions",
    "initial_strength",
    "StateInput",
    "ActionPlan",
    "HeroInput",
    "LineResult",
    "CompareOutput",
]
