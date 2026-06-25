"""
Evaluator: candidate-action generation, EV aggregation and ``compare_actions``.

This is the solver's top-level brain. It:
  1. translates a scenario into the rollout engine's numeric hero input,
  2. generates a sensible set of candidate lines for the spot (or accepts custom
     ones),
  3. runs Monte Carlo rollouts for each line,
  4. aggregates placement distributions into EV metrics,
  5. ranks the lines by a goal-aware reward, and
  6. attaches explanations.

The solver package has no web/pydantic dependencies — it works on the plain
dataclasses below so it can be tested in isolation.
"""

from __future__ import annotations

import statistics
import zlib
from dataclasses import dataclass, field
from typing import List, Optional

from ..config import (
    BENCH_STRENGTH,
    BOARD_STRENGTH_MULT,
    FINAL_STAGE,
    ITEMS_STRENGTH,
    LOBBY_SIZE,
    MAX_LEVEL,
    PAIR_STRENGTH,
    REFRESH_COST,
    STAGE_PHASES,
    stage_baseline_strength,
)
from . import explanation
from .leveling import LevelState, gold_to_reach_level
from .rollout import ActionPlan, HeroInput, SimResult, simulate_action


# ---------------------------------------------------------------------------
# Plain input / output types
# ---------------------------------------------------------------------------

@dataclass
class StateInput:
    stage: str = "midgame"          # early | midgame | late
    hp: int = 60
    gold: int = 40
    level: int = 6
    board_strength: str = "medium"  # weak | medium | strong
    bench_value: str = "medium"     # low | medium | high
    pairs: int = 1
    items: str = "medium"           # low | medium | high
    lobby_tempo: str = "medium"     # low | medium | high
    goal: str = "top4"              # top4 | first

    def stage_number(self) -> int:
        return STAGE_PHASES.get(self.stage, 4)


@dataclass
class Branch:
    label: str
    prob: float
    expected_placement: float


@dataclass
class LineResult:
    key: str
    label: str
    expected_placement: float
    top4_rate: float
    first_rate: float
    bot4_rate: float
    risk: float
    distribution: List[float]      # 8 normalized probabilities (placement 1..8)
    ev_score: float
    branches: List[Branch] = field(default_factory=list)
    explanation: str = ""


@dataclass
class CompareOutput:
    results: List[LineResult]
    best_key: str
    summary: str
    n_rollouts: int
    seed: int


# ---------------------------------------------------------------------------
# Scenario -> numeric hero input
# ---------------------------------------------------------------------------

def initial_strength(state: StateInput) -> float:
    stage = state.stage_number()
    baseline = stage_baseline_strength(stage)
    s = baseline * BOARD_STRENGTH_MULT.get(state.board_strength, 1.0)
    s += ITEMS_STRENGTH.get(state.items, 0.0)
    s += PAIR_STRENGTH * max(0, state.pairs)
    s += 0.4 * BENCH_STRENGTH.get(state.bench_value, 0.0)
    return s


def to_hero_input(state: StateInput) -> HeroInput:
    hunting = max(1, min(5, state.pairs + 1))
    return HeroInput(
        stage=state.stage_number(),
        hp=int(state.hp),
        gold=int(state.gold),
        level=int(state.level),
        strength=initial_strength(state),
        hunting=hunting,
        lobby_tempo=state.lobby_tempo,
    )


# ---------------------------------------------------------------------------
# Candidate action generation
# ---------------------------------------------------------------------------

def generate_candidate_actions(state: StateInput) -> List[ActionPlan]:
    """Generate a clean, feasible set of lines for the spot."""
    gold = state.gold
    level = state.level
    actions: List[ActionPlan] = [ActionPlan(key="save", label="Save")]

    # Leveling line (one level up), if affordable.
    next_cost = gold_to_reach_level(LevelState(level), level + 1)
    can_level = level < MAX_LEVEL and gold >= next_cost
    if can_level:
        actions.append(
            ActionPlan(key=f"level_{level + 1}", label=f"Level to {level + 1}",
                       level_target=level + 1)
        )

    # Roll-down lines at the current level.
    for floor in (30, 20, 10, 0):
        if floor < gold and (gold - floor) >= 2 * REFRESH_COST:
            label = "Roll to 0 (all-in)" if floor == 0 else f"Roll to {floor}"
            actions.append(ActionPlan(key=f"roll_{floor}", label=label, roll_to_gold=floor))

    # Combined: level once then roll, only if both are meaningfully affordable.
    if can_level and (gold - next_cost) >= 4 * REFRESH_COST:
        combo_floor = 10 if (gold - next_cost) > 24 else 0
        actions.append(
            ActionPlan(
                key=f"level_{level + 1}_roll_{combo_floor}",
                label=f"Level to {level + 1} + roll to {combo_floor}",
                level_target=level + 1,
                roll_to_gold=combo_floor,
            )
        )

    # De-duplicate by key, cap to a readable number of lines.
    seen, unique = set(), []
    for a in actions:
        if a.key not in seen:
            seen.add(a.key)
            unique.append(a)
    return unique[:6]


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def _reward(placement: int, goal: str) -> float:
    if goal == "first":
        return {1: 12, 2: 6, 3: 3, 4: 1}.get(placement, 0)
    # top4: reward survival and better placements within the top half
    return max(0, 5 - placement)


def _aggregate(sim: SimResult, goal: str) -> dict:
    placements = sim.placements
    n = len(placements)
    counts = [0] * 8
    for p in placements:
        counts[min(8, max(1, p)) - 1] += 1
    distribution = [c / n for c in counts]
    expected = sum(placements) / n
    top4 = sum(1 for p in placements if p <= 4) / n
    first = sum(1 for p in placements if p == 1) / n
    bot4 = sum(1 for p in placements if p >= 5) / n
    risk = statistics.pstdev(placements) if n > 1 else 0.0
    ev_score = sum(_reward(p, goal) for p in placements) / n

    # Decision tree: split on the first fight result.
    wins = [p for p, w in zip(placements, sim.first_fight_wins) if w]
    losses = [p for p, w in zip(placements, sim.first_fight_wins) if not w]
    branches = []
    if wins:
        branches.append(Branch("Win the next fight", len(wins) / n, sum(wins) / len(wins)))
    if losses:
        branches.append(Branch("Lose the next fight", len(losses) / n, sum(losses) / len(losses)))

    return {
        "expected_placement": expected,
        "top4_rate": top4,
        "first_rate": first,
        "bot4_rate": bot4,
        "risk": risk,
        "distribution": distribution,
        "ev_score": ev_score,
        "branches": branches,
    }


def _seed_for(state: StateInput) -> int:
    key = "|".join(str(v) for v in (
        state.stage, state.hp, state.gold, state.level, state.board_strength,
        state.bench_value, state.pairs, state.items, state.lobby_tempo, state.goal,
    ))
    return zlib.crc32(key.encode("utf-8"))


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------

def compare_actions(
    state: StateInput,
    candidate_actions: Optional[List[ActionPlan]] = None,
    n_rollouts: int = 3000,
    seed: Optional[int] = None,
) -> CompareOutput:
    """Evaluate every candidate line and return them ranked best-first.

    ``seed`` overrides the state-derived seed — pass a fresh/random value for
    true (non-reproducible) Monte Carlo sampling, or leave it None for the
    deterministic, cacheable default.
    """
    actions = candidate_actions or generate_candidate_actions(state)
    hero_in = to_hero_input(state)
    seed = seed if seed is not None else _seed_for(state)

    raw: List[tuple[ActionPlan, dict]] = []
    for action in actions:
        # Common random seed across lines reduces comparison variance.
        sim = simulate_action(hero_in, action, n_rollouts, seed)
        raw.append((action, _aggregate(sim, state.goal)))

    # Rank by goal-aware EV score, tie-broken by expected placement.
    raw.sort(key=lambda t: (-t[1]["ev_score"], t[1]["expected_placement"]))
    best_action, best_metrics = raw[0]

    state_dict = state.__dict__
    results: List[LineResult] = []
    for action, m in raw:
        results.append(LineResult(
            key=action.key,
            label=action.label,
            expected_placement=round(m["expected_placement"], 2),
            top4_rate=round(m["top4_rate"], 4),
            first_rate=round(m["first_rate"], 4),
            bot4_rate=round(m["bot4_rate"], 4),
            risk=round(m["risk"], 3),
            distribution=[round(x, 4) for x in m["distribution"]],
            ev_score=round(m["ev_score"], 4),
            branches=m["branches"],
            explanation=explanation.explain_line(
                action.key, action.label, m, state_dict, best_metrics,
                is_best=(action.key == best_action.key),
            ),
        ))

    summary = explanation.summarize(
        best_action.key, best_action.label,
        [r.__dict__ for r in results], state_dict, state.goal,
    )

    return CompareOutput(
        results=results,
        best_key=best_action.key,
        summary=summary,
        n_rollouts=n_rollouts,
        seed=seed,
    )


# ---------------------------------------------------------------------------
# Future-stage projection
# ---------------------------------------------------------------------------

@dataclass
class StageProjection:
    stage: int
    survival: float
    exp_hp: float
    strength_vs_lobby: float
    exp_placement: float


@dataclass
class ProjectOutput:
    line_key: str
    line_label: str
    trajectory: List[StageProjection]
    watch_next: str
    final_placement: float
    top4_rate: float
    seed: int


def project_line(sim, start_stage: int) -> List[StageProjection]:
    """Aggregate per-rollout stage snapshots into a forward trajectory."""
    n = len(sim.placements) or 1
    out: List[StageProjection] = []
    for s in range(start_stage, FINAL_STAGE + 1):
        hps: List[float] = []
        svl: List[float] = []
        finals: List[int] = []
        for i, snaps in enumerate(sim.snaps):
            snap = next((x for x in snaps if x.stage == s and x.alive), None)
            if snap is not None:
                hps.append(snap.hp)
                svl.append(snap.hero_strength / max(1.0, snap.lobby_avg_strength))
                finals.append(sim.placements[i])
        survival = len(finals) / n
        out.append(StageProjection(
            stage=s,
            survival=round(survival, 4),
            exp_hp=round(sum(hps) / len(hps), 1) if hps else 0.0,
            strength_vs_lobby=round(sum(svl) / len(svl), 3) if svl else 0.0,
            # conditional expected final placement *given* you reach this stage alive
            exp_placement=round(sum(finals) / len(finals), 2) if finals else 8.0,
        ))
    return out


def _watch_next(traj: List[StageProjection]) -> str:
    """One-line 'what to look for next stage' from the trajectory."""
    for i in range(1, len(traj)):
        prev, cur = traj[i - 1], traj[i]
        if prev.survival - cur.survival > 0.08:
            return (f"Stage {cur.stage}: the danger window — survival dips to "
                    f"{round(cur.survival * 100)}% (~{round(cur.exp_hp)} HP). Have board strength ready.")
        if cur.strength_vs_lobby and cur.strength_vs_lobby < 0.95:
            return (f"Stage {cur.stage}: the lobby out-scales you "
                    f"({cur.strength_vs_lobby:.2f}× parity) — you need a spike or you bleed.")
    return "Trajectory is stable — keep executing the line and protect your HP into the late game."


def project(
    state: StateInput,
    line_key: Optional[str] = None,
    candidate_actions: Optional[List[ActionPlan]] = None,
    n_rollouts: int = 2000,
    seed: Optional[int] = None,
) -> ProjectOutput:
    """Project the chosen (or best) line forward through the remaining stages."""
    actions = candidate_actions or generate_candidate_actions(state)
    hero_in = to_hero_input(state)
    sd = seed if seed is not None else _seed_for(state)

    if line_key:
        plan = next((a for a in actions if a.key == line_key), actions[0])
    else:
        out = compare_actions(state, actions, n_rollouts=min(1500, n_rollouts), seed=sd)
        plan = next((a for a in actions if a.key == out.best_key), actions[0])

    sim = simulate_action(hero_in, plan, n_rollouts, sd, collect_snaps=True)
    traj = project_line(sim, state.stage_number())
    placements = sim.placements
    final_place = sum(placements) / len(placements) if placements else 8.0
    top4 = sum(1 for p in placements if p <= 4) / len(placements) if placements else 0.0

    return ProjectOutput(
        line_key=plan.key, line_label=plan.label, trajectory=traj,
        watch_next=_watch_next(traj), final_placement=round(final_place, 2),
        top4_rate=round(top4, 4), seed=sd,
    )
