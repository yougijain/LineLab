"""
Abstract combat model.

This is deliberately **not** a unit-by-unit battle simulator. It collapses a
board into a single strength scalar and answers two questions a macro solver
needs:

  * ``estimate_fight_outcome`` — given your board strength and an opponent's,
    what is your probability of winning the round?
  * ``estimate_hp_loss`` — if you lose, how much health do you lose?

Keeping combat abstract is both a modeling choice (macro decisions don't need
positioning) and a compliance choice (no recreation of any real game's combat).
"""

from __future__ import annotations

import math

from ..config import STAGE_BASE_DAMAGE, WINPROB_SCALE


def estimate_fight_outcome(board_strength: float, lobby_strength: float) -> float:
    """Probability that ``board_strength`` beats ``lobby_strength`` in a round.

    A logistic of the strength difference: equal boards are a coin flip; a wide
    gap approaches a near-certain result while never being a guaranteed 0/1.
    """
    diff = (board_strength - lobby_strength) / WINPROB_SCALE
    return 1.0 / (1.0 + math.exp(-diff))


def estimate_hp_loss(stage: int, loss_margin: float) -> int:
    """Health lost by the loser of a round.

    = base stage damage + a surviving-unit term that scales with how badly the
    round was lost (a larger strength gap leaves more enemy units alive). The
    surviving-unit term is bounded to a sensible board size.
    """
    base = STAGE_BASE_DAMAGE.get(max(2, min(7, stage)), 6)
    # Map the (positive) loss margin to surviving units, ~1..9.
    survivors = 1 + min(8.0, max(0.0, loss_margin) / 6.0)
    return int(round(base + survivors))
