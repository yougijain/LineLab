"""
Leveling model: experience, level-up costs and natural breakpoints.

Buying experience converts gold into a higher level, which raises the unit cap
and improves shop odds (access to rarer, stronger units). The solver weighs this
against rolling (immediate strength) and saving (compounding gold).
"""

from __future__ import annotations

from dataclasses import dataclass

from ..config import MAX_LEVEL, XP_BUY_AMOUNT, XP_BUY_COST, XP_PASSIVE, XP_TO_NEXT


@dataclass
class LevelState:
    level: int
    xp: int = 0               # experience accumulated toward the next level

    def xp_to_next(self) -> int:
        return XP_TO_NEXT.get(self.level, 10**9)

    def is_max(self) -> bool:
        return self.level >= MAX_LEVEL


def add_xp(state: LevelState, amount: int) -> int:
    """Add experience, rolling over level-ups. Returns levels gained."""
    gained = 0
    state.xp += amount
    while not state.is_max() and state.xp >= state.xp_to_next():
        state.xp -= state.xp_to_next()
        state.level += 1
        gained += 1
    if state.is_max():
        state.xp = 0
    return gained


def buy_xp_once(state: LevelState) -> int:
    """Apply one experience purchase (caller is responsible for the gold)."""
    return add_xp(state, XP_BUY_AMOUNT)


def passive_xp(state: LevelState) -> int:
    return add_xp(state, XP_PASSIVE)


def gold_to_reach_level(state: LevelState, target_level: int) -> int:
    """Approximate gold required to buy up to ``target_level`` from the current
    state, accounting for the experience already banked. Ignores passive XP
    (a small, conservative over-estimate)."""
    if target_level <= state.level:
        return 0
    xp_needed = state.xp_to_next() - state.xp
    for lvl in range(state.level + 1, target_level):
        xp_needed += XP_TO_NEXT.get(lvl, 10**9)
    purchases = -(-xp_needed // XP_BUY_AMOUNT)   # ceil division
    return purchases * XP_BUY_COST
