// Board-strength helpers shared by the engine and the solver-state mapping.

import { STAR_MULT, TIER_BASE } from "./config";
import { MODULES_BY_KEY, traitBonus } from "./data";
import type { FieldUnit, Hero } from "./types";

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
