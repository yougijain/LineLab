# The LineLab Solver model

This document explains the abstract auto-battler the Solver reasons about, how
its EV engine works, and — importantly — how it is designed to stay clear of any
specific game's intellectual property.

## 1. Design goals

1. **Teach transferable macro skill.** The decisions that matter in any
   auto-battler economy game — save vs spend, level vs roll, roll-to-X, slam vs
   hold, stabilize vs cap, top-4 vs first, pivot vs commit — are model-agnostic.
2. **Be an original work.** The model is a *generic* auto-battler, not a
   recreation of any title. It has invented units, traits and stat modules, and
   uses an abstract single-scalar combat model rather than a battle simulator.
3. **Be honest.** Outputs are Monte Carlo estimates with visible risk, not
   oracle pronouncements. When two lines are close, the table shows them close.

## 2. The abstract game

A lobby of **8 players** each have **health** (start 100) and place **1st–8th**;
**top 4** is the survival line. The game is a sequence of combat rounds grouped
into stages (early / mid / late map to representative stages).

| System | How it is modeled (generic) |
| --- | --- |
| **Economy** | passive income, interest (+1 per 10 banked, capped at +5), win/loss streak bonuses, a per-win bonus. `economy.py` |
| **Leveling** | buy experience (fixed gold→XP), per-level XP costs, a unit-cap that rises with level. `leveling.py` |
| **Shop** | 5 slots, a refresh cost, tiered odds by level (tiers I–V), a depletable pool. `shop.py` |
| **Units / traits / items** | original fictional roster, synergy breakpoints, and offensive/defensive/utility stat modules. `units.py`, `traits.py`, `items.py` |
| **Combat** | an **abstract board-strength scalar**, not a unit battle. `combat_model.py` |

The numeric constants (`config.py`) are tuned so the *decision space* feels like
a real economy game, but they are generic values, not copied data tables.

### Board strength

Combat is collapsed to a single number per board. A scenario's qualitative
inputs (board strength weak/medium/strong, items, pairs, bench) map to an
initial strength relative to a stage baseline; leveling and rolling raise it over
time with **diminishing returns** (a board can only absorb so many upgrades in
one window). The win probability of a round is a logistic of the strength
difference, so leads matter but no single fight is ever certain.

```
estimate_fight_outcome(self, opp) = 1 / (1 + e^-((self-opp)/scale))
estimate_hp_loss(stage, margin)   = base_damage[stage] + surviving_units(margin)
```

## 3. The EV engine

For each candidate **line** the engine runs `n` Monte Carlo games
(`rollout.simulate_action`):

1. Build an 8-player lobby. The **hero** has a fully-modeled economy; the seven
   opponents are strength + health trajectories whose pace is set by the lobby
   tempo, with persistent per-opponent "skill" and occasional spikes so the
   field stays competitive.
2. Round loop: apply the line on the decision round (then a shared baseline
   policy after, so lines differ by the *opening decision*), pair players, fight
   via the abstract model, deal health loss, accrue income, eliminate players at
   0 health and assign placements.
3. Stop once the hero's placement resolves.

`evaluator.compare_actions` aggregates the placement distributions into expected
placement, top-4 / first / bot-4 rates, a risk (std-dev) number, and a one-ply
decision tree (how often the line wins the *next* fight and the placement that
follows). Lines are ranked by a **goal-aware reward** (top-4 rewards survival;
first heavily rewards 1st). The rollout seed is derived from the state, so
results are reproducible and cacheable, and all lines share the seed
(common-random-numbers) to reduce comparison variance.

### Candidate lines

`evaluator.generate_candidate_actions` proposes only *feasible* lines for the
spot: Save; Level (if affordable); Roll to 30/20/10/0 (those below current gold);
and a combined Level-then-roll when both are affordable. The frontend can also
submit custom lines.

## 4. Does it behave sensibly?

`scripts/calibrate.py` prints EV tables. Representative, directionally-correct
behavior:

- **Weak board, pressured, fast lobby (top-4):** a small stabilizing roll edges
  out saving; over-rolling and leveling-into-nothing grade worst. All lines are
  mediocre — an honestly bad spot.
- **Healthy strong board, late (first):** **Save** — you're winning; the reckless
  all-in only lowers your first-place equity.
- **Critically low HP, weak, late:** rolling to stabilize beats saving by a wide
  margin (survival first).
- **Healthy early win-streak (first):** leveling for tempo beats saving and
  rolling.

The test suite (`tests/test_solver.py`) locks in the high-signal directional
invariants plus well-formedness (distributions normalize, rates are consistent,
rankings are monotone).

## 5. Compliance rationale

The Solver is an **original game model**: invented units/traits/items, generic
odds and economy constants, an abstract (non-simulator) combat model, and
synthetic data only. It therefore uses **no** Riot/TFT names, assets, icons,
champion/item/trait names, combat formulas, UI, client access, or live game
state. It is not a TFT simulator and does not resemble TFT in function (it
compares macro EV; it does not recreate a board or fights).

The TFT-branded **Study** product is kept strictly separate — static, pre-game
content and self-player post-game review — and only ever uses approved assets
and APIs after Riot clearance. The two products are separated in code, UI and
data so a reviewer can evaluate each unambiguously. See
[`RIOT_SUBMISSION.md`](RIOT_SUBMISSION.md).
