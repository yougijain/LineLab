// The one-verb coach. Collapses the solver's recommended line into a single
// action word a brand-new player can act on instantly: ROLL / LEVEL / SAVE /
// STABILIZE. The dense EV math still exists behind "Advanced"; this is the
// 5-second read that teaches the single most important decision of the game.

import type { CompareResponse, GameState } from "@/lib/types";

export type CoachVerb = "ROLL" | "LEVEL" | "SAVE" | "STABILIZE";

export interface VerbMeta {
  label: CoachVerb;
  color: string;
  /** Generic, patch-agnostic teaching gloss shown under the verb. */
  gloss: string;
}

export const VERB_META: Record<CoachVerb, VerbMeta> = {
  SAVE: {
    label: "SAVE",
    color: "#34d399",
    gloss: "Bank gold for interest — don't roll yet.",
  },
  LEVEL: {
    label: "LEVEL",
    color: "#60a5fa",
    gloss: "Buy XP — more units and better shop odds.",
  },
  ROLL: {
    label: "ROLL",
    color: "#fbbf24",
    gloss: "Spend a burst of gold to find your upgrades.",
  },
  STABILIZE: {
    label: "STABILIZE",
    color: "#f87171",
    gloss: "Low HP — spend now to stop the bleed.",
  },
};

/** HP at or below which spending is reframed as STABILIZE. */
export const STABILIZE_HP = 30;

/** Map a solver line key (+ current HP) to a single coach verb. */
export function verbFromKey(key: string, hp: number): CoachVerb {
  const k = key.toLowerCase();
  let base: CoachVerb;
  if (k.startsWith("save")) base = "SAVE";
  else if (k.startsWith("level") && k.includes("roll")) base = "LEVEL"; // level-then-roll: the push is the headline
  else if (k.startsWith("level")) base = "LEVEL";
  else if (k.includes("roll")) base = "ROLL";
  else base = "SAVE";

  // Spending while low keeps you alive — teach it as STABILIZE.
  if (hp <= STABILIZE_HP && (base === "ROLL" || base === "LEVEL")) return "STABILIZE";
  return base;
}

export interface CoachVerdict {
  verb: CoachVerb;
  meta: VerbMeta;
  /** The solver's own plain-English reason for the chosen line. */
  why: string;
  /** The full line label (e.g. "Roll to 30"), for the curious. */
  lineLabel: string;
}

/** Derive the one-verb verdict from a full solver response. */
export function verdictFromResult(data: CompareResponse, state: GameState): CoachVerdict {
  const best = data.results.find((r) => r.key === data.best_key) ?? data.results[0];
  const verb = verbFromKey(best?.key ?? "save", state.hp);
  return {
    verb,
    meta: VERB_META[verb],
    why: best?.explanation ?? data.summary ?? VERB_META[verb].gloss,
    lineLabel: best?.label ?? "",
  };
}
