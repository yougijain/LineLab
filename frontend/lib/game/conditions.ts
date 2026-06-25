// Game-wide CONDITIONS — original, augment/encounter-like modifiers that shape a
// run. Two layers: per-game "Modifiers" (pick-1-of-3 at offer stages) and
// per-stage "Lobby Events". All effects are applied hero-side in the engine; the
// solver mirror folds them into the buckets it already understands.

import { BASE_INCOME, INTEREST_CAP, REFRESH_COST, XP_BUY_COST } from "./config";
import type { ActiveConditions, ConditionDef, Game } from "./types";

export const CONDITION_CATALOG: ConditionDef[] = [
  // --- MODIFIERS: econ ---
  { key: "compound", name: "Compound Vault", tier: "rare", layer: "modifier", category: "econ",
    blurb: "Interest cap +1 (save up to 60 gold).", interestCapDelta: 1 },
  { key: "dividend", name: "Steady Dividend", tier: "common", layer: "modifier", category: "econ",
    blurb: "+1 base income every round.", baseIncomeDelta: 1 },
  { key: "tuition", name: "Tuition Waiver", tier: "common", layer: "modifier", category: "econ",
    blurb: "XP costs 1 less (3 gold).", xpCostDelta: -1 },
  { key: "bargain", name: "Bargain Bin", tier: "common", layer: "modifier", category: "econ",
    blurb: "Reroll costs 1 gold.", refreshCostDelta: -1 },
  { key: "safetynet", name: "Safety Net", tier: "rare", layer: "modifier", category: "econ",
    blurb: "Gain +2 gold whenever you lose a round.", lossGold: 2 },
  // --- MODIFIERS: combat ---
  { key: "phalanx", name: "Phalanx Drill", tier: "rare", layer: "modifier", category: "combat",
    blurb: "Board strength ×1.06.", strengthMult: 1.06 },
  { key: "cushion", name: "Soft Landing", tier: "common", layer: "modifier", category: "combat",
    blurb: "Take 15% less HP damage on a loss.", lossDmgMult: 0.85 },
  { key: "overclock", name: "Overclock Core", tier: "prismatic", layer: "modifier", category: "combat",
    blurb: "Board strength ×1.12, but +10% damage on a loss.", strengthMult: 1.12, lossDmgMult: 1.1 },
  // --- MODIFIERS: trait ---
  { key: "pyreFocus", name: "Ember Focus", tier: "rare", layer: "modifier", category: "trait",
    blurb: "+4 strength while Pyre is active.", traitBoost: { family: "pyre", minBp: 2, flat: 4 } },
  { key: "forgeFocus", name: "Anvil Focus", tier: "rare", layer: "modifier", category: "trait",
    blurb: "+4 strength while Forge is active.", traitBoost: { family: "forge", minBp: 2, flat: 4 } },
  { key: "roleFocus", name: "Vanguard Focus", tier: "prismatic", layer: "modifier", category: "trait",
    blurb: "+6 strength at 4 Wardens.", traitBoost: { family: "warden", minBp: 4, flat: 6 } },
  // --- MODIFIERS: tempo ---
  { key: "headstart", name: "Head Start", tier: "prismatic", layer: "modifier", category: "tempo",
    blurb: "Immediately +1 level and +3 gold.", onPick: { level: 1, gold: 3 } },
  { key: "scout", name: "Free Scout", tier: "common", layer: "modifier", category: "tempo",
    blurb: "One free reroll each round.", freeRolls: 1 },
  // --- LOBBY EVENTS (per-stage) ---
  { key: "goldRush", name: "Gold Rush", tier: "common", layer: "event", category: "econ",
    blurb: "+2 income this stage.", baseIncomeDelta: 2 },
  { key: "austerity", name: "Austerity", tier: "common", layer: "event", category: "econ",
    blurb: "Interest cap −1 this stage.", interestCapDelta: -1 },
  { key: "bloodbath", name: "Bloodbath", tier: "rare", layer: "event", category: "combat",
    blurb: "Losses hurt 15% more this stage.", lossDmgMult: 1.15 },
  { key: "cheapXP", name: "Open Library", tier: "common", layer: "event", category: "econ",
    blurb: "XP costs 1 less this stage.", xpCostDelta: -1 },
];

export const CONDITION_BY_KEY: Record<string, ConditionDef> = Object.fromEntries(
  CONDITION_CATALOG.map((d) => [d.key, d]),
);

export const TIER_COLOR: Record<string, string> = {
  common: "#9ca3af",
  rare: "#38bdf8",
  prismatic: "#fbbf24",
};

function rand(g: Game): number {
  let t = (g.rngState = (g.rngState + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function defaultConditions(): ActiveConditions {
  return {
    modifiers: [], event: null,
    interestCap: INTEREST_CAP, baseIncome: BASE_INCOME, xpCost: XP_BUY_COST,
    refreshCost: REFRESH_COST, freeRolls: 0, strengthMult: 1, lossDmgMult: 1,
    lossGold: 0, traitBoost: {},
  };
}

export function recomputeConditions(g: Game): void {
  const c = g.conditions;
  let interestCap = INTEREST_CAP, baseIncome = BASE_INCOME, xpCost = XP_BUY_COST, refreshCost = REFRESH_COST;
  let strengthMult = 1, lossDmgMult = 1, lossGold = 0, freeRolls = 0;
  const traitBoost: Record<string, { minBp: number; flat: number }> = {};
  const apply = (def?: ConditionDef) => {
    if (!def) return;
    interestCap += def.interestCapDelta ?? 0;
    baseIncome += def.baseIncomeDelta ?? 0;
    xpCost += def.xpCostDelta ?? 0;
    refreshCost += def.refreshCostDelta ?? 0;
    lossGold += def.lossGold ?? 0;
    freeRolls += def.freeRolls ?? 0;
    if (def.strengthMult) strengthMult *= def.strengthMult;
    if (def.lossDmgMult) lossDmgMult *= def.lossDmgMult;
    if (def.traitBoost) traitBoost[def.traitBoost.family] = { minBp: def.traitBoost.minBp, flat: def.traitBoost.flat };
  };
  for (const k of c.modifiers) apply(CONDITION_BY_KEY[k]);
  if (c.event) apply(CONDITION_BY_KEY[c.event]);
  c.interestCap = Math.max(0, interestCap);
  c.baseIncome = Math.max(0, baseIncome);
  c.xpCost = Math.max(1, xpCost);
  c.refreshCost = Math.max(1, refreshCost);
  c.strengthMult = strengthMult;
  c.lossDmgMult = lossDmgMult;
  c.lossGold = lossGold;
  c.freeRolls = freeRolls;
  c.traitBoost = traitBoost;
}

/** Extra flat strength from active trait-boost conditions. */
export function traitBoostBonus(traitCounts: Record<string, number>, c: ActiveConditions): number {
  let bonus = 0;
  for (const [family, tb] of Object.entries(c.traitBoost)) {
    if ((traitCounts[family] ?? 0) >= tb.minBp) bonus += tb.flat;
  }
  return bonus;
}

/** A seeded pick-1-of-N offer (2 all-common for Beginner, else 3 tier-weighted). */
export function offerThree(g: Game): string[] {
  const beginner = g.settings.learnTier === "beginner";
  const taken = new Set(g.conditions.modifiers);
  let pool = CONDITION_CATALOG.filter((d) => d.layer === "modifier" && !taken.has(d.key));
  if (beginner) pool = pool.filter((d) => d.tier === "common");
  const count = beginner ? 2 : 3;
  const weight = (t: string) => (t === "common" ? 0.6 : t === "rare" ? 0.3 : 0.1);
  const avail = [...pool];
  const out: string[] = [];
  for (let i = 0; i < count && avail.length; i++) {
    const total = avail.reduce((s, d) => s + weight(d.tier), 0);
    let r = rand(g) * total;
    let idx = 0;
    for (; idx < avail.length - 1; idx++) {
      r -= weight(avail[idx].tier);
      if (r <= 0) break;
    }
    out.push(avail.splice(idx, 1)[0].key);
  }
  return out;
}

export function pickModifier(g: Game, key: string): void {
  const def = CONDITION_BY_KEY[key];
  if (!def || def.layer !== "modifier") return;
  g.conditions.modifiers.push(key);
  if (def.onPick) {
    if (def.onPick.level) g.hero.level = Math.min(9, g.hero.level + def.onPick.level);
    if (def.onPick.gold) g.hero.gold += def.onPick.gold;
  }
  g.pendingOffer = null;
  recomputeConditions(g);
  g.freeRollsLeft = g.conditions.freeRolls;
}

export function rollStageEvent(g: Game): void {
  const events = CONDITION_CATALOG.filter((d) => d.layer === "event");
  g.conditions.event = events[Math.floor(rand(g) * events.length)].key;
  recomputeConditions(g);
}
