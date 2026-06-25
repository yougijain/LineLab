"""
Monte Carlo rollout engine.

The solver evaluates a candidate *line* (an action plan) by simulating the rest
of the game many times and recording where the hero places. The simulation is a
full abstract lobby of ``LOBBY_SIZE`` players:

  * the hero has a fully modelled economy (gold / level / rolling -> strength),
  * the seven opponents are modelled as strength + health trajectories whose
    pace is set by the lobby tempo,
  * each round players are paired and fought via the abstract combat model,
  * losers lose health, players hit 0 are eliminated and assigned a placement,
  * we stop once the hero's placement is resolved.

This is intentionally an *abstract* simulation of macro dynamics, not a
unit-level battle simulator.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import List, Optional

from ..config import (
    FINAL_STAGE,
    LEVEL_STRENGTH_GAIN,
    LOBBY_SIZE,
    LOBBY_TEMPO_MULT,
    LOBBY_TEMPO_SPREAD,
    MAX_ROLL_GAIN,
    REFRESH_COST,
    ROLL_SATURATION,
    ROUNDS_PER_STAGE,
    XP_BUY_COST,
    stage_baseline_strength,
)
from .combat_model import estimate_fight_outcome, estimate_hp_loss
from .economy import next_streak, round_income
from .leveling import LevelState, buy_xp_once, gold_to_reach_level, passive_xp
from .shop import estimate_upgrade_probability, target_tiers_for_level


# ---------------------------------------------------------------------------
# Inputs / outputs
# ---------------------------------------------------------------------------

@dataclass
class HeroInput:
    """Numeric initial hero state at the decision point."""
    stage: int
    hp: int
    gold: int
    level: int
    strength: float
    hunting: int               # how many distinct upgrades help (≈ open pairs+1)
    lobby_tempo: str


@dataclass
class ActionPlan:
    """A candidate line to evaluate."""
    key: str
    label: str
    level_target: Optional[int] = None     # buy XP up to this level (None = don't level)
    roll_to_gold: Optional[int] = None     # refresh down to this gold floor (None = don't roll)


@dataclass
class SimResult:
    placements: List[int] = field(default_factory=list)
    first_fight_wins: List[bool] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Internal player representation
# ---------------------------------------------------------------------------

@dataclass
class _Player:
    hp: float
    strength: float
    is_hero: bool
    alive: bool = True
    streak: int = 0
    gold: int = 0
    level: LevelState = field(default_factory=lambda: LevelState(1))
    hunting: int = 1
    growth_mult: float = 1.0       # persistent "skill": how fast this opponent scales
    placement: int = 0


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def expected_level_for_stage(stage: int) -> int:
    return {2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 8}.get(max(2, min(7, stage)), 8)


def stage_typical_hp(stage: int) -> float:
    return {2: 88, 3: 74, 4: 60, 5: 46, 6: 33, 7: 22}.get(max(2, min(7, stage)), 50)


def _soft_cap(stage: int, level: int) -> float:
    base = stage_baseline_strength(stage) * 1.45
    level_bonus = max(0, level - expected_level_for_stage(stage)) * 8.0
    return base + level_bonus + 18.0


def _gain_factor(strength: float, stage: int, level: int) -> float:
    """Diminishing returns: rolling pays off far less once you near your cap."""
    cap = _soft_cap(stage, level)
    headroom = (cap - strength) / (0.6 * cap)
    return _clamp(headroom, 0.12, 1.0)


def _roll(hero: _Player, gold_spend: int, stage: int, rng: random.Random) -> None:
    """Spend gold on refreshes; convert expected useful hits into strength.

    A roll-down's benefit *saturates*: the first few upgrades help a lot, but a
    board can only absorb so much in one window, so more refreshes yield
    diminishing strength. The gain is then scaled by how much headroom you have
    below your level's strength ceiling, and given lucky/unlucky variance.
    """
    if gold_spend < REFRESH_COST:
        return
    tiers = target_tiers_for_level(hero.level.level)
    est = estimate_upgrade_probability(hero.level.level, gold_spend, tiers, hero.hunting)
    hero.gold -= est.refreshes * REFRESH_COST

    saturating = 1.0 - math.exp(-ROLL_SATURATION * est.expected_useful)
    base_gain = MAX_ROLL_GAIN * saturating
    noise = max(0.0, rng.gauss(1.0, 0.4))      # high-roll / low-roll variance
    factor = _gain_factor(hero.strength, stage, hero.level.level)
    hero.strength += base_gain * noise * factor


def _level_to(hero: _Player, target: int, reserve: int = 0) -> None:
    """Buy XP up to ``target`` level while keeping at least ``reserve`` gold."""
    while hero.level.level < target and hero.gold - XP_BUY_COST >= reserve:
        hero.gold -= XP_BUY_COST
        gained = buy_xp_once(hero.level)
        hero.strength += gained * LEVEL_STRENGTH_GAIN


def _apply_plan(hero: _Player, plan: ActionPlan, stage: int, rng: random.Random) -> None:
    """Execute the candidate line on the first decision round."""
    if plan.level_target is not None:
        _level_to(hero, plan.level_target)
    if plan.roll_to_gold is not None:
        spend = max(0, hero.gold - plan.roll_to_gold)
        _roll(hero, spend, stage, rng)


def _baseline_policy(hero: _Player, stage: int, rng: random.Random) -> None:
    """Shared, reasonable policy used on every round after the decision round.

    This makes all lines converge to sensible late play, so the EV differences
    between lines reflect the *opening decision*, not divergent autopilots.
    """
    target_lvl = expected_level_for_stage(stage)
    if hero.level.level < target_lvl:
        _level_to(hero, target_lvl, reserve=6)
    if hero.hp < 35 and hero.gold >= REFRESH_COST:
        _roll(hero, hero.gold, stage, rng)            # stabilize: roll to survive
    elif hero.gold > 54:
        _roll(hero, hero.gold - 50, stage, rng)        # don't waste gold past interest cap


# ---------------------------------------------------------------------------
# Lobby construction
# ---------------------------------------------------------------------------

def _make_lobby(hero_in: HeroInput, rng: random.Random) -> List[_Player]:
    tempo_mult = LOBBY_TEMPO_MULT.get(hero_in.lobby_tempo, 1.0)
    spread = LOBBY_TEMPO_SPREAD.get(hero_in.lobby_tempo, 11.0)
    baseline = stage_baseline_strength(hero_in.stage)

    hero = _Player(
        hp=float(hero_in.hp),
        strength=hero_in.strength,
        is_hero=True,
        gold=hero_in.gold,
        level=LevelState(hero_in.level),
        hunting=hero_in.hunting,
    )
    players = [hero]
    for _ in range(LOBBY_SIZE - 1):
        strength = baseline * tempo_mult + rng.gauss(0.0, spread)
        hp = _clamp(rng.gauss(stage_typical_hp(hero_in.stage), 18.0), 8.0, 100.0)
        growth_mult = _clamp(rng.gauss(1.0, 0.28), 0.55, 1.65)
        players.append(_Player(hp=hp, strength=max(5.0, strength), is_hero=False,
                               growth_mult=growth_mult))
    return players


def _opponent_step(opp: _Player, stage: int, tempo_mult: float, rng: random.Random) -> None:
    base = (stage_baseline_strength(stage + 1) - stage_baseline_strength(stage)) / ROUNDS_PER_STAGE
    growth = base * tempo_mult * opp.growth_mult
    opp.strength += rng.gauss(growth, growth * 0.45)
    # Occasional opponent spike (their own roll-down) keeps the field dynamic so
    # the hero is not the only player who can jump in strength.
    if rng.random() < 0.10:
        opp.strength += max(0.0, rng.gauss(6.0, 3.0))


def _fight(a: _Player, b: _Player, stage: int, rng: random.Random) -> _Player:
    """Resolve one pairing; return the winner. Adds small per-fight noise."""
    sa = a.strength + rng.gauss(0.0, 4.0)
    sb = b.strength + rng.gauss(0.0, 4.0)
    p_a_wins = estimate_fight_outcome(sa, sb)
    if rng.random() < p_a_wins:
        winner, loser = a, b
    else:
        winner, loser = b, a
    margin = max(0.0, winner.strength - loser.strength)
    loser.hp -= estimate_hp_loss(stage, margin)
    winner.streak = next_streak(winner.streak, True)
    loser.streak = next_streak(loser.streak, False)
    return winner


# ---------------------------------------------------------------------------
# A single rollout
# ---------------------------------------------------------------------------

def _one_rollout(hero_in: HeroInput, plan: ActionPlan, rng: random.Random):
    tempo_mult = LOBBY_TEMPO_MULT.get(hero_in.lobby_tempo, 1.0)
    players = _make_lobby(hero_in, rng)
    hero = players[0]

    stage = hero_in.stage
    round_in_stage = 0
    first_fight_win: Optional[bool] = None
    horizon = 70

    for _step in range(horizon):
        alive = [p for p in players if p.alive]
        if not hero.alive or len(alive) <= 1:
            break

        # --- economy / strength updates ---
        if _step == 0:
            _apply_plan(hero, plan, stage, rng)
        else:
            _baseline_policy(hero, stage, rng)
        passive_xp(hero.level)
        for opp in alive:
            if not opp.is_hero:
                _opponent_step(opp, stage, tempo_mult, rng)

        # --- pairing & combat ---
        order = alive[:]
        rng.shuffle(order)
        hero_won = False
        for i in range(0, len(order) - 1, 2):
            winner = _fight(order[i], order[i + 1], stage, rng)
            if order[i].is_hero or order[i + 1].is_hero:
                hero_won = winner.is_hero
        # odd one out gets a bye (no damage)
        if first_fight_win is None and _step == 0:
            first_fight_win = hero_won

        # --- hero income for next round ---
        if hero.alive:
            hero.gold += round_income(hero.gold, hero.streak, hero_won)

        # --- eliminations ---
        dying = [p for p in players if p.alive and p.hp <= 0]
        if dying:
            n_alive_before = len([p for p in players if p.alive])
            dying.sort(key=lambda p: p.hp)        # lowest hp = worst placement
            for i, p in enumerate(dying):
                p.alive = False
                p.placement = n_alive_before - i

        # --- advance time ---
        round_in_stage += 1
        if round_in_stage >= ROUNDS_PER_STAGE:
            round_in_stage = 0
            stage = min(FINAL_STAGE, stage + 1)

    # resolve survivors
    survivors = [p for p in players if p.alive]
    if survivors:
        survivors.sort(key=lambda p: (p.strength, p.hp), reverse=True)
        for rank, p in enumerate(survivors, start=1):
            p.placement = rank
    if hero.placement == 0:
        hero.placement = 1

    return hero.placement, bool(first_fight_win) if first_fight_win is not None else False


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def simulate_action(hero_in: HeroInput, plan: ActionPlan, n_rollouts: int, seed: int) -> SimResult:
    """Run ``n_rollouts`` Monte Carlo games with the hero following ``plan``."""
    rng = random.Random(seed)
    result = SimResult()
    for _ in range(n_rollouts):
        placement, first_win = _one_rollout(hero_in, plan, rng)
        result.placements.append(placement)
        result.first_fight_wins.append(first_win)
    return result
