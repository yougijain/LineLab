"""
Economy model: gold income, interest and streaks.

Generic auto-battler economy. The central tension the solver exists to teach is
that gold is a currency you can convert into board strength (by rolling) or into
levels (better odds) or bank for compounding interest — and health is a separate
currency you spend to buy time for the economy to pay off.
"""

from __future__ import annotations

from ..config import (
    BASE_INCOME,
    INTEREST_CAP,
    INTEREST_PER,
    WIN_GOLD,
    streak_bonus,
)


def interest(gold: int) -> int:
    """Interest gold from banking ``gold`` (1 per 10, capped)."""
    return min(INTEREST_CAP, max(0, gold) // INTEREST_PER)


def round_income(gold: int, streak_len: int, won: bool) -> int:
    """Total gold gained at the end of a round.

    = passive base + interest + streak bonus + win bonus.
    ``streak_len`` is signed (positive win streak / negative loss streak); only
    the magnitude matters for the bonus.
    """
    income = BASE_INCOME
    income += interest(gold)
    income += streak_bonus(streak_len)
    if won:
        income += WIN_GOLD
    return income


def next_streak(streak_len: int, won: bool) -> int:
    """Advance a signed streak counter given a win/loss this round."""
    if won:
        return streak_len + 1 if streak_len >= 0 else 1
    return streak_len - 1 if streak_len <= 0 else -1


def gold_to_interest_breakpoint(gold: int) -> int:
    """Gold needed to reach the next +1 interest breakpoint (0 if at cap)."""
    if interest(gold) >= INTEREST_CAP:
        return 0
    next_bp = (gold // INTEREST_PER + 1) * INTEREST_PER
    return next_bp - gold
