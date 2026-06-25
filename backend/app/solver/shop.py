"""
Shop model: tiered odds, rolling, and upgrade-probability estimation.

Implements ``estimate_upgrade_probability`` — given a level, a gold budget to
spend on refreshes, and which tiers you are hunting, estimate the probability of
finding at least one "useful upgrade", plus the expected number of useful hits.
The rollout uses the expected-hits figure to convert rolling into board
strength.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence

from ..config import (
    DISTINCT_UNITS_PER_TIER,
    REFRESH_COST,
    SHOP_ODDS,
    SHOP_SLOTS,
)


def tier_odds(level: int) -> List[float]:
    """Per-slot probability (0..1) of each tier I..V at a given level."""
    pct = SHOP_ODDS.get(max(1, min(9, level)), SHOP_ODDS[9])
    return [p / 100.0 for p in pct]


def slot_hit_probability(level: int, target_tiers: Sequence[int], hunting: int = 1) -> float:
    """Probability a single shop slot is a *useful* unit.

    A slot is useful if it is one of the tiers you are hunting AND it is one of
    the specific units you actually want. We approximate the "specific unit"
    dilution by ``hunting / distinct_units_in_tier`` — i.e. if you want 1 of the
    ~8 tier-IV units, only ~1/8 of tier-IV slots help you. ``hunting`` lets the
    caller widen the net (e.g. several open pairs).
    """
    odds = tier_odds(level)
    p = 0.0
    for tier in target_tiers:
        if 1 <= tier <= 5:
            distinct = DISTINCT_UNITS_PER_TIER[tier]
            useful_fraction = min(1.0, hunting / distinct)
            p += odds[tier - 1] * useful_fraction
    return min(1.0, p)


@dataclass
class UpgradeEstimate:
    p_at_least_one: float       # P(>=1 useful unit appears)
    expected_useful: float      # expected count of useful units seen
    refreshes: int              # number of refreshes the budget pays for


def estimate_upgrade_probability(
    level: int,
    gold_budget: int,
    target_tiers: Sequence[int],
    hunting: int = 1,
) -> UpgradeEstimate:
    """Estimate upgrade luck from spending ``gold_budget`` on refreshes.

    Each refresh shows ``SHOP_SLOTS`` independent slots. Expected useful hits =
    refreshes * slots * per-slot hit probability. P(>=1) uses the complement of
    "every slot misses".
    """
    if not target_tiers:
        return UpgradeEstimate(0.0, 0.0, 0)
    refreshes = max(0, gold_budget // REFRESH_COST)
    slots = refreshes * SHOP_SLOTS
    p_slot = slot_hit_probability(level, target_tiers, hunting=hunting)
    expected_useful = slots * p_slot
    p_at_least_one = 1.0 - (1.0 - p_slot) ** slots if slots else 0.0
    return UpgradeEstimate(p_at_least_one, expected_useful, refreshes)


def target_tiers_for_level(level: int) -> List[int]:
    """The tiers a player at ``level`` is realistically hunting when rolling."""
    if level <= 4:
        return [1, 2]
    if level == 5:
        return [2, 3]
    if level == 6:
        return [2, 3]
    if level == 7:
        return [3, 4]
    if level == 8:
        return [3, 4]
    return [4, 5]
