"""
Original, fictional trait system for the LineLab abstract auto-battler.

Traits are invented synergy groups. Fielding enough units sharing a trait hits
a *breakpoint* that grants a strength bonus. This mirrors the generic idea of
synergy thresholds without copying any specific game's traits.

The solver uses traits in two ways:
  * to give "going vertical" (stacking one trait) a credible strength payoff, and
  * to feed the abstract board-strength evaluation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class Trait:
    key: str
    name: str
    kind: str               # "origin" | "role"
    # breakpoint -> strength bonus granted when that many copies are fielded
    breakpoints: Dict[int, float]


TRAITS: List[Trait] = [
    # Origins
    Trait("pyre", "Pyre", "origin", {2: 4, 4: 11, 6: 22}),
    Trait("tide", "Tide", "origin", {2: 4, 4: 10, 6: 20}),
    Trait("storm", "Storm", "origin", {2: 5, 3: 10, 4: 18}),
    Trait("drift", "Drift", "origin", {3: 6, 5: 15}),
    Trait("forge", "Forge", "origin", {2: 4, 4: 12, 6: 21}),
    # Roles
    Trait("marksman", "Marksman", "role", {2: 5, 4: 13}),
    Trait("warden", "Warden", "role", {2: 5, 4: 12, 6: 20}),
    Trait("mystic", "Mystic", "role", {2: 4, 4: 11}),
    Trait("skirmisher", "Skirmisher", "role", {2: 4, 4: 10, 6: 18}),
]

TRAITS_BY_KEY = {t.key: t for t in TRAITS}


def trait_bonus(trait_key: str, count: int) -> float:
    """Strength bonus from fielding ``count`` units of a trait (highest
    breakpoint that is satisfied)."""
    trait = TRAITS_BY_KEY.get(trait_key)
    if trait is None:
        return 0.0
    best = 0.0
    for bp, bonus in trait.breakpoints.items():
        if count >= bp:
            best = max(best, bonus)
    return best


def max_breakpoint(trait_key: str) -> int:
    trait = TRAITS_BY_KEY.get(trait_key)
    if trait is None or not trait.breakpoints:
        return 0
    return max(trait.breakpoints)
