"""
Original, fictional item ("stat module") system for the LineLab abstract
auto-battler.

These are invented stat modules, not the items of any real game. The solver
cares about items at the level of *macro decisions*:

  * how much board strength your current items provide, and
  * the classic "slam now vs. hold for best-in-slot" tempo tradeoff.

Modules combine from two components, route to a role (offensive / defensive /
utility), and contribute abstract strength.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

# Fictional basic components. Two components fuse into one completed module.
COMPONENTS: List[str] = [
    "edge",      # offensive
    "spark",     # offensive (ability)
    "core",      # resource/utility
    "plating",   # defensive (armor)
    "ward",      # defensive (resist)
    "vital",     # defensive (health)
    "lens",      # utility (precision)
    "sigil",     # trait/utility (emblem-like)
]

ITEM_CLASSES = ("offensive", "defensive", "utility")

MAX_MODULES_PER_UNIT = 3


@dataclass(frozen=True)
class Module:
    key: str
    name: str
    item_class: str
    strength: float          # abstract strength this completed module adds


# A small, original set of completed modules.
MODULES: List[Module] = [
    Module("razorline", "Razorline", "offensive", 9.0),
    Module("starcaller", "Starcaller", "offensive", 9.5),
    Module("hailstorm", "Hailstorm", "offensive", 8.5),
    Module("aegishide", "Aegishide", "defensive", 7.5),
    Module("bulwark", "Bulwark", "defensive", 7.0),
    Module("lifewell", "Lifewell", "defensive", 7.0),
    Module("farsight", "Farsight", "utility", 6.0),
    Module("emblem_sigil", "Emblem Sigil", "utility", 5.0),
]

MODULES_BY_KEY = {m.key: m for m in MODULES}


def slam_value(stage: int, hp: int, committed: bool) -> float:
    """A heuristic 0..1 score for *slamming* a generic completed module now
    versus holding components for a best-in-slot build.

    Higher = slamming is more justified. The classic heuristics:
      * slamming influences more rounds the earlier you are,
      * slam harder when low on HP (you need board strength now),
      * holding only makes sense when healthy AND uncommitted to a carry.
    """
    early = max(0.0, (6 - stage) / 4.0)          # earlier stages favor slamming
    hp_pressure = max(0.0, (75 - hp) / 75.0)      # low HP favors slamming
    commit = 0.25 if committed else 0.0           # committed carry favors slamming
    score = 0.45 * early + 0.45 * hp_pressure + commit
    return max(0.0, min(1.0, score))
