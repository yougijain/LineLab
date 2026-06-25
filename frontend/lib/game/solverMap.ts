// Map the live game state to the solver's /api/compare input (inverse of the
// backend evaluator.initial_strength), so the live coach and the post-game
// review reason about the same spot.

import { stageBaselineStrength } from "./config";
import { countPairs, fieldedTraitCounts, heroBoardStrength, itemCount } from "./strength";
import { traitBoostBonus } from "./conditions";
import type { Game, SolverState } from "./types";

export function stagePhase(stage: number): "early" | "midgame" | "late" {
  if (stage <= 2) return "early";
  if (stage <= 4) return "midgame";
  return "late";
}

export function avgBotStrength(game: Game): number {
  const alive = game.bots.filter((b) => b.alive);
  if (!alive.length) return stageBaselineStrength(game.stage);
  return alive.reduce((s, b) => s + b.strength, 0) / alive.length;
}

export function toSolverState(game: Game): SolverState {
  const hero = game.hero;
  const c = game.conditions;
  const baseline = stageBaselineStrength(game.stage);
  // Fold combat conditions into the board-strength bucket so the solver sees them.
  const hs = heroBoardStrength(hero) * c.strengthMult + traitBoostBonus(fieldedTraitCounts(hero.board), c);
  const ratio = hs / baseline;

  const board_strength = ratio < 0.92 ? "weak" : ratio > 1.07 ? "strong" : "medium";
  const benchCount = hero.bench.length;
  const bench_value = benchCount <= 1 ? "low" : benchCount <= 3 ? "medium" : "high";
  const items = itemCount(hero) <= 1 ? "low" : itemCount(hero) <= 3 ? "medium" : "high";
  const tempoRatio = avgBotStrength(game) / baseline;
  const lobby_tempo = tempoRatio < 0.98 ? "low" : tempoRatio > 1.06 ? "high" : "medium";

  return {
    stage: stagePhase(game.stage),
    hp: Math.max(1, Math.round(hero.hp)),
    gold: hero.gold,
    level: hero.level,
    board_strength,
    bench_value,
    pairs: Math.min(6, countPairs(hero)),
    items,
    lobby_tempo,
    goal: game.settings.goal,
  };
}
