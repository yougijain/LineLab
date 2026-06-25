// Client-side mirror of the LineLab game constants (backend/app/config.py).
// Kept in sync by hand; these are the genericized, original-IP game numbers the
// playable auto-chess and the solver share. No third-party game data.

export const LOBBY_SIZE = 8;
export const TOP_CUT = 4;
export const START_HEALTH = 100;
export const MAX_LEVEL = 9;

// Economy
export const BASE_INCOME = 5;
export const INTEREST_PER = 10;
export const INTEREST_CAP = 5;
export const WIN_GOLD = 1;

export function interest(gold: number): number {
  return Math.min(INTEREST_CAP, Math.floor(Math.max(0, gold) / INTEREST_PER));
}

export function streakBonus(streakLen: number): number {
  const m = Math.abs(streakLen);
  if (m >= 6) return 3;
  if (m === 5) return 2;
  if (m >= 3) return 1;
  return 0;
}

export function goldToNextInterest(gold: number): number {
  if (interest(gold) >= INTEREST_CAP) return 0;
  return (Math.floor(gold / INTEREST_PER) + 1) * INTEREST_PER - gold;
}

// Leveling
export const XP_BUY_COST = 4;
export const XP_BUY_AMOUNT = 4;
export const XP_PASSIVE = 2;
export const XP_TO_NEXT: Record<number, number> = {
  1: 2, 2: 2, 3: 6, 4: 10, 5: 20, 6: 36, 7: 60, 8: 68,
};

// Shop
export const SHOP_SLOTS = 5;
export const REFRESH_COST = 2;
export const COPIES_FOR_UPGRADE = 3;

// Per-slot tier probability (0..1) by level, tiers I..V (index 0..4).
export const SHOP_ODDS: Record<number, number[]> = {
  1: [1.0, 0, 0, 0, 0],
  2: [1.0, 0, 0, 0, 0],
  3: [0.75, 0.25, 0, 0, 0],
  4: [0.55, 0.30, 0.15, 0, 0],
  5: [0.45, 0.33, 0.20, 0.02, 0],
  6: [0.30, 0.40, 0.25, 0.05, 0],
  7: [0.19, 0.30, 0.40, 0.10, 0.01],
  8: [0.17, 0.24, 0.32, 0.24, 0.03],
  9: [0.15, 0.18, 0.25, 0.30, 0.12],
};

export function tierOdds(level: number): number[] {
  return SHOP_ODDS[Math.max(1, Math.min(9, level))] ?? SHOP_ODDS[9];
}

// Shared depletable pool: copies of each individual unit by tier.
export const POOL_COPIES_PER_UNIT: Record<number, number> = {
  1: 30, 2: 25, 3: 18, 4: 10, 5: 9,
};

// Unit cost (gold) to buy, by tier.
export const TIER_COST: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

// Stages
export const FINAL_STAGE = 7;
export const ROUNDS_PER_STAGE = 5;
export const STAGE_BASE_DAMAGE: Record<number, number> = {
  2: 3, 3: 5, 4: 6, 5: 8, 6: 12, 7: 16,
};

export function stageBaselineStrength(stage: number): number {
  return 20 + 14 * (stage - 2);
}

// Combat — per-unit strength contribution.
export const TIER_BASE: Record<number, number> = { 1: 6, 2: 9, 3: 13, 4: 18, 5: 24 };
export const STAR_MULT: Record<number, number> = { 1: 1, 2: 1.8, 3: 3.2 };

export const WINPROB_SCALE = 12;
export function winProbability(self: number, opp: number): number {
  return 1 / (1 + Math.exp(-(self - opp) / WINPROB_SCALE));
}

// Board-strength contributions (mirror of the solver's evaluator).
export const TRAIT_BONUS_SCALE = 1.0; // traits.ts supplies the bonuses
export const ITEM_SLOTS_PER_UNIT = 3;
