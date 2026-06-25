"""
Original, fictional unit roster for the LineLab abstract auto-battler.

These units exist only to give the solver a flavorful, *generic* roster to
reason about. They are wholly invented and share no names, abilities, art or
identity with any real game. Each unit has a tier (I–V), a couple of trait
tags, and a coarse role used by the item model.

The solver does not simulate unit abilities; units feed the abstract
board-strength model via their tier, traits and roles.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from ..config import POOL_COPIES_PER_UNIT


@dataclass(frozen=True)
class Unit:
    key: str
    name: str
    tier: int                 # 1..5
    traits: List[str]
    role: str                 # "carry" | "frontline" | "flex"

    @property
    def pool_copies(self) -> int:
        return POOL_COPIES_PER_UNIT[self.tier]


# A compact, original roster. Trait keys reference traits.py.
ROSTER: List[Unit] = [
    # Tier I
    Unit("emberkit", "Emberkit", 1, ["pyre", "skirmisher"], "flex"),
    Unit("dustmote", "Dustmote", 1, ["drift", "skirmisher"], "frontline"),
    Unit("tallow", "Tallow", 1, ["forge", "warden"], "frontline"),
    Unit("sparrowtail", "Sparrowtail", 1, ["drift", "marksman"], "carry"),
    Unit("cinderpup", "Cinderpup", 1, ["pyre", "warden"], "frontline"),
    Unit("glimmerfin", "Glimmerfin", 1, ["tide", "mystic"], "carry"),
    # Tier II
    Unit("brackwarden", "Brackwarden", 2, ["tide", "warden"], "frontline"),
    Unit("quillark", "Quillark", 2, ["drift", "marksman"], "carry"),
    Unit("slagborn", "Slagborn", 2, ["forge", "skirmisher"], "flex"),
    Unit("voltaire", "Voltaire", 2, ["storm", "mystic"], "carry"),
    Unit("ashglen", "Ashglen", 2, ["pyre", "marksman"], "carry"),
    # Tier III
    Unit("thornveil", "Thornveil", 3, ["drift", "mystic"], "flex"),
    Unit("ironhowl", "Ironhowl", 3, ["forge", "warden"], "frontline"),
    Unit("mistral", "Mistral", 3, ["storm", "skirmisher"], "carry"),
    Unit("saltcrown", "Saltcrown", 3, ["tide", "warden"], "frontline"),
    Unit("pyrelady", "Pyrelady", 3, ["pyre", "mystic"], "carry"),
    # Tier IV
    Unit("graveltongue", "Graveltongue", 4, ["forge", "marksman"], "carry"),
    Unit("nimbusqueen", "Nimbusqueen", 4, ["storm", "mystic"], "carry"),
    Unit("deeproot", "Deeproot", 4, ["tide", "warden"], "frontline"),
    Unit("scorchwing", "Scorchwing", 4, ["pyre", "skirmisher"], "carry"),
    # Tier V
    Unit("the_kindler", "The Kindler", 5, ["pyre", "mystic"], "carry"),
    Unit("tempest_prime", "Tempest Prime", 5, ["storm", "warden"], "flex"),
    Unit("leviath", "Leviath", 5, ["tide", "skirmisher"], "frontline"),
]

ROSTER_BY_KEY = {u.key: u for u in ROSTER}
ROSTER_BY_TIER = {
    t: [u for u in ROSTER if u.tier == t] for t in range(1, 6)
}


def units_of_tier(tier: int) -> List[Unit]:
    return ROSTER_BY_TIER.get(tier, [])
