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
  // visible-board construction (scouting)
  boardSizePace: number; // units fielded ≈ min(level, 1 + round(stage*pace))
  levelPace: number; // level ≈ min(9, 2 + floor(stage*levelPace))
  itemPace: number; // items per stage
  starBias: number; // prob a fielded unit is 2★+
  botModifiers: number; // hidden econ/combat modifiers granted (balance vs buffed hero)
}

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  { key: "casual", label: "Casual", blurb: "Loose, greedy bots. Forgiving lobby.",
    tempoFactor: 0.82, econOpt: 0.5, mistakeRate: 0.35, luckMult: 0.8, spikeChance: 0.05,
    boardSizePace: 0.55, levelPace: 0.55, itemPace: 0.6, starBias: 0.15, botModifiers: 0 },
  { key: "easy", label: "Easy", blurb: "Below-average play.",
    tempoFactor: 0.9, econOpt: 0.7, mistakeRate: 0.2, luckMult: 0.9, spikeChance: 0.07,
    boardSizePace: 0.65, levelPace: 0.65, itemPace: 0.8, starBias: 0.25, botModifiers: 0 },
  { key: "ranked", label: "Ranked", blurb: "Even, solver-default lobby.",
    tempoFactor: 1.0, econOpt: 0.85, mistakeRate: 0.1, luckMult: 1.0, spikeChance: 0.1,
    boardSizePace: 0.75, levelPace: 0.75, itemPace: 1.0, starBias: 0.4, botModifiers: 0 },
  { key: "hard", label: "Hard", blurb: "Tight, interest-aware bots.",
    tempoFactor: 1.08, econOpt: 0.95, mistakeRate: 0.04, luckMult: 1.12, spikeChance: 0.13,
    boardSizePace: 0.85, levelPace: 0.85, itemPace: 1.2, starBias: 0.55, botModifiers: 1 },
  { key: "apex", label: "Apex", blurb: "Near-optimal, punishing lobby.",
    tempoFactor: 1.16, econOpt: 1.0, mistakeRate: 0.01, luckMult: 1.25, spikeChance: 0.16,
    boardSizePace: 0.95, levelPace: 0.95, itemPace: 1.4, starBias: 0.7, botModifiers: 2 },
];

/** Original comp identities a bot can commit to — trait pairs present in ROSTER. */
export interface BotIdentity {
  key: string;
  traits: [string, string];
  label: string;
  buildLine: string;
}

export const BOT_IDENTITIES: BotIdentity[] = [
  { key: "pyre_mystic", traits: ["pyre", "mystic"], label: "Pyre Casters", buildLine: "Forcing Pyre — wants Pyrelady / The Kindler" },
  { key: "drift_marksman", traits: ["drift", "marksman"], label: "Drift Snipers", buildLine: "Drift marksmen — wants Quillark / Graveltongue" },
  { key: "tide_warden", traits: ["tide", "warden"], label: "Tide Wall", buildLine: "Tanky Tide front — wants Deeproot" },
  { key: "forge_skirmisher", traits: ["forge", "skirmisher"], label: "Forge Brawlers", buildLine: "Forge divers — wants Scorchwing" },
  { key: "storm_mystic", traits: ["storm", "mystic"], label: "Storm Casters", buildLine: "Storm casters — wants Nimbusqueen" },
];

export const BOT_IDENTITY_BY_KEY: Record<string, BotIdentity> = Object.fromEntries(
  BOT_IDENTITIES.map((b) => [b.key, b]),
);

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
