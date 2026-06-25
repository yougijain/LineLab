// The two independent sliders:
//   1. botDifficulty  — how strong/optimal the 7 opponents are.
//   2. learningTier   — how much UI/coaching complexity the player sees.

import type { LearnTier } from "./types";

export interface BotDifficulty {
  key: string;
  label: string;
  blurb: string;
  tempoFactor: number; // initial + ongoing strength multiplier
  econOpt: number; // how much of the ideal growth they realize
  mistakeRate: number; // chance to under-grow a round
  luckMult: number; // upgrade-luck multiplier
  spikeChance: number; // chance of a per-round strength spike
}

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  { key: "casual", label: "Casual", blurb: "Loose, greedy bots. Forgiving lobby.",
    tempoFactor: 0.82, econOpt: 0.5, mistakeRate: 0.35, luckMult: 0.8, spikeChance: 0.05 },
  { key: "easy", label: "Easy", blurb: "Below-average play.",
    tempoFactor: 0.9, econOpt: 0.7, mistakeRate: 0.2, luckMult: 0.9, spikeChance: 0.07 },
  { key: "ranked", label: "Ranked", blurb: "Even, solver-default lobby.",
    tempoFactor: 1.0, econOpt: 0.85, mistakeRate: 0.1, luckMult: 1.0, spikeChance: 0.1 },
  { key: "hard", label: "Hard", blurb: "Tight, interest-aware bots.",
    tempoFactor: 1.08, econOpt: 0.95, mistakeRate: 0.04, luckMult: 1.12, spikeChance: 0.13 },
  { key: "apex", label: "Apex", blurb: "Near-optimal, punishing lobby.",
    tempoFactor: 1.16, econOpt: 1.0, mistakeRate: 0.01, luckMult: 1.25, spikeChance: 0.16 },
];

export const BOT_DIFF_BY_KEY: Record<string, BotDifficulty> = Object.fromEntries(
  BOT_DIFFICULTIES.map((d) => [d.key, d]),
);

export function botDiff(key: string): BotDifficulty {
  return BOT_DIFF_BY_KEY[key] ?? BOT_DIFF_BY_KEY.ranked;
}

// ---------------------------------------------------------------------------

export interface LearnConfig {
  label: string;
  blurb: string;
  coachLines: number; // how many solver lines to surface
  coachMetrics: boolean; // show per-line top4/first numbers
  coachTree: boolean; // show the decision tree
  showStreak: boolean;
  showInterestDots: boolean;
  showTraitDetail: boolean;
  showItems: boolean;
  lockGoalTop4: boolean;
  collapseRolls: boolean; // collapse roll_* to one "Roll" in coach
  suggestedBot: string;
}

export const LEARN_TIERS: Record<LearnTier, LearnConfig> = {
  beginner: {
    label: "Beginner", blurb: "Economy first — just gold, health, and the big three moves.",
    coachLines: 1, coachMetrics: false, coachTree: false, showStreak: false,
    showInterestDots: true, showTraitDetail: false, showItems: false,
    lockGoalTop4: true, collapseRolls: true, suggestedBot: "casual",
  },
  standard: {
    label: "Standard", blurb: "Tempo — levels, board strength, and roll timing.",
    coachLines: 3, coachMetrics: true, coachTree: false, showStreak: true,
    showInterestDots: true, showTraitDetail: true, showItems: true,
    lockGoalTop4: false, collapseRolls: false, suggestedBot: "ranked",
  },
  pro: {
    label: "Pro", blurb: "Full macro — every line, the EV table, and the decision tree.",
    coachLines: 6, coachMetrics: true, coachTree: true, showStreak: true,
    showInterestDots: true, showTraitDetail: true, showItems: true,
    lockGoalTop4: false, collapseRolls: false, suggestedBot: "hard",
  },
};
