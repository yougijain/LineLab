// Board-strength helpers shared by the engine and the solver-state mapping.

import { STAR_MULT, TIER_BASE } from "./config";
import { MODULES_BY_KEY, ROSTER_BY_KEY, traitBonus } from "./data";
import type { FieldUnit, Game, Hero } from "./types";

/** Distinct fielded units per trait (a unit counts once per trait). */
export function fieldedTraitCounts(board: FieldUnit[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const u of board) {
    if (seen.has(u.key)) continue;
    seen.add(u.key);
    for (const t of u.traits) counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

export function unitStrength(u: FieldUnit): number {
  let s = (TIER_BASE[u.tier] ?? 6) * (STAR_MULT[u.star] ?? 1);
  for (const m of u.items) s += MODULES_BY_KEY[m]?.strength ?? 0;
  return s;
}

/** Abstract scalar strength of the fielded board (units + traits + items). */
export function heroBoardStrength(hero: Hero): number {
  let s = 0;
  for (const u of hero.board) s += unitStrength(u);
  const counts = fieldedTraitCounts(hero.board);
  for (const [trait, c] of Object.entries(counts)) s += traitBonus(trait, c);
  return s;
}

/** Count of 1-star unit keys held at exactly 2 copies (one short of a 2-star). */
export function countPairs(hero: Hero): number {
  const tally: Record<string, number> = {};
  for (const u of [...hero.board, ...hero.bench]) {
    if (u.star === 1) tally[u.key] = (tally[u.key] || 0) + 1;
  }
  return Object.values(tally).filter((n) => n === 2).length;
}

/** Count of completed item modules (attached + in the bank). */
export function itemCount(hero: Hero): number {
  let n = hero.itemBank.length;
  for (const u of [...hero.board, ...hero.bench]) n += u.items.length;
  return n;
}

export type ThreatLevel = "Low" | "Even" | "High";

/** How threatening a bot is relative to the hero's current board. */
export function threatBand(botStrength: number, hero: Hero): ThreatLevel {
  const hs = heroBoardStrength(hero) || 1;
  const r = botStrength / hs;
  return r < 0.9 ? "Low" : r > 1.1 ? "High" : "Even";
}

export interface Contention {
  key: string;
  name: string;
  rivalCopies: number;
  rivals: string[];
}

/** Which of the hero's units are contested by rival bot boards (pool pressure). */
export function poolContention(game: Game): Contention[] {
  const heroKeys = new Set([...game.hero.board, ...game.hero.bench].map((u) => u.key));
  const tally: Record<string, { copies: number; rivals: Set<string> }> = {};
  for (const bot of game.bots) {
    if (!bot.alive) continue;
    for (const u of bot.board.units) {
      if (!heroKeys.has(u.key)) continue;
      if (!tally[u.key]) tally[u.key] = { copies: 0, rivals: new Set() };
      tally[u.key].copies += 1;
      tally[u.key].rivals.add(bot.name);
    }
  }
  return Object.entries(tally)
    .map(([key, v]) => ({
      key,
      name: ROSTER_BY_KEY[key]?.name ?? key,
      rivalCopies: v.copies,
      rivals: [...v.rivals],
    }))
    .sort((a, b) => b.rivalCopies - a.rivalCopies);
}
