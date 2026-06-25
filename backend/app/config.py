"""
LineLab Solver — game configuration constants.

This file defines the *abstract auto-battler* that the solver reasons about. It
is an ORIGINAL, fictional game. It deliberately contains **no** Teamfight
Tactics / Riot Games names, assets, champions, items, traits, combat formulas,
or exact mechanics. The numeric values below are tuned to make the *macro
decision space* (economy, leveling, rolling, tempo, stabilize-vs-cap) feel
realistic for a generic auto-battler, but they are generic constants, not a
recreation of any specific game.

Tiers are referred to by neutral roman numerals (I–V). Flavor content (unit,
trait and item names) lives in ``units.py``, ``traits.py`` and ``items.py``.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Lobby / placement
# ---------------------------------------------------------------------------

LOBBY_SIZE = 8                # players per lobby
TOP_CUT = 4                   # placements 1..4 are "top 4" (the survival line)
START_HEALTH = 100           # player health at game start
MAX_LEVEL = 9                # practical level ceiling for this model

# ---------------------------------------------------------------------------
# Economy
# ---------------------------------------------------------------------------

BASE_INCOME = 5              # passive gold granted at the end of each round
INTEREST_PER = 10           # +1 gold interest per this many gold banked
INTEREST_CAP = 5            # interest is capped here (i.e. maxes out at 50 gold)
WIN_GOLD = 1                # bonus gold for winning a combat round

# Streak bonus gold keyed by the *magnitude* of the current win or loss streak.
# (A generic version of the classic auto-battler streak curve.)
def streak_bonus(streak_len: int) -> int:
    mag = abs(streak_len)
    if mag >= 6:
        return 3
    if mag == 5:
        return 2
    if mag >= 3:
        return 1
    return 0


# ---------------------------------------------------------------------------
# Leveling
# ---------------------------------------------------------------------------

XP_BUY_COST = 4             # gold spent to buy a chunk of experience
XP_BUY_AMOUNT = 4          # experience granted per purchase
XP_PASSIVE = 2             # experience granted passively each round

# Experience required to advance from level L to L+1.
XP_TO_NEXT = {
    1: 2,
    2: 2,
    3: 6,
    4: 10,
    5: 20,
    6: 36,
    7: 60,
    8: 68,
}

# ---------------------------------------------------------------------------
# Shop
# ---------------------------------------------------------------------------

SHOP_SLOTS = 5             # units offered per shop
REFRESH_COST = 2          # gold to refresh the shop ("reroll")

# Probability (percent) that a given shop slot shows a unit of tier I..V,
# indexed by player level. A generic, monotone "higher level unlocks rarer
# units" curve in the spirit of a typical auto-battler.
SHOP_ODDS = {
    1: [100, 0, 0, 0, 0],
    2: [100, 0, 0, 0, 0],
    3: [75, 25, 0, 0, 0],
    4: [55, 30, 15, 0, 0],
    5: [45, 33, 20, 2, 0],
    6: [30, 40, 25, 5, 0],
    7: [19, 30, 40, 10, 1],
    8: [17, 24, 32, 24, 3],
    9: [15, 18, 25, 30, 12],
}

# Number of copies of each individual unit available in the shared pool, by
# tier. Higher-tier units are scarcer, which gates how feasible it is to find
# many copies. Used by the upgrade-probability estimate.
POOL_COPIES_PER_UNIT = {1: 30, 2: 25, 3: 18, 4: 10, 5: 9}

# Number of distinct units per tier (drives how "diluted" a tier is when you
# are hunting one specific unit).
DISTINCT_UNITS_PER_TIER = {1: 13, 2: 12, 3: 10, 4: 8, 5: 6}

COPIES_FOR_UPGRADE = 3    # copies needed to upgrade a unit one star level

# ---------------------------------------------------------------------------
# Stages
# ---------------------------------------------------------------------------
#
# We model the game as a sequence of combat rounds grouped into stages. The
# three coarse "phases" map onto representative stages so a user can describe a
# spot as simply Early / Midgame / Late.

STAGE_PHASES = {
    "early": 2,
    "midgame": 4,
    "late": 6,
}

FINAL_STAGE = 7           # game is effectively decided by the end of this stage
ROUNDS_PER_STAGE = 5      # abstracted combat rounds per stage

# Base health lost by the loser of a combat round, by stage. Real damage also
# scales with how many enemy units survive; that surviving-unit term is added
# on top of this in ``combat_model.estimate_hp_loss``.
STAGE_BASE_DAMAGE = {
    2: 3,
    3: 5,
    4: 6,
    5: 8,
    6: 12,
    7: 16,
}

# ---------------------------------------------------------------------------
# Board strength model
# ---------------------------------------------------------------------------
#
# Board strength is an abstract scalar (~0..120). It is NOT a combat simulation;
# it is a single-number proxy for "how strong is this board relative to the
# field". The constants below translate the qualitative scenario inputs into
# that scalar and govern how it evolves as the player levels and rolls.

# Expected board strength of an "average" lobby member at the start of a stage.
# The lobby gets stronger over time; the hero is measured relative to it.
def stage_baseline_strength(stage: int) -> float:
    # Smooth ramp: roughly +14 strength per stage.
    return 20.0 + 14.0 * (stage - 2)


# Qualitative board strength relative to the stage baseline. Kept deliberately
# tight so leads don't explode at high stages (a "strong" board is a meaningful
# edge, not an auto-win).
BOARD_STRENGTH_MULT = {"weak": 0.85, "medium": 1.00, "strong": 1.13}

# Flat strength contributions from secondary scenario inputs.
ITEMS_STRENGTH = {"low": 0.0, "medium": 4.0, "high": 8.0}
BENCH_STRENGTH = {"low": 0.0, "medium": 2.0, "high": 5.0}     # latent, realized by rolling
PAIR_STRENGTH = 1.0        # small immediate strength; pairs mostly help via rolling

# How strong the lobby is / how fast it scales (tempo of the 7 opponents).
LOBBY_TEMPO_MULT = {"low": 0.95, "medium": 1.02, "high": 1.10}
LOBBY_TEMPO_SPREAD = {"low": 9.0, "medium": 11.0, "high": 13.0}  # std-dev of opp strength

# Strength gained per level-up (better unit cap + better shop odds).
LEVEL_STRENGTH_GAIN = 7.0

# Rolling converts gold into board strength, but with strong diminishing
# returns: your board can only absorb so many upgrades in one roll-down. A
# single roll-down's strength gain saturates toward ``MAX_ROLL_GAIN`` as the
# expected number of useful hits grows (``ROLL_SATURATION`` sets how fast).
MAX_ROLL_GAIN = 14.0
ROLL_SATURATION = 0.22

# Legacy linear coefficient (kept for reference; the saturating model above is
# what the rollout uses).
UPGRADE_STRENGTH_GAIN = 3.3

# Logistic scale for converting a board-strength difference into a win
# probability in ``combat_model.estimate_fight_outcome``. Larger = noisier
# single fights (a strength lead matters less in any one round).
WINPROB_SCALE = 12.0

# ---------------------------------------------------------------------------
# Solver
# ---------------------------------------------------------------------------

DEFAULT_ROLLOUTS = 3000
MAX_ROLLOUTS = 20000
