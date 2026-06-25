"use client";

import { XP_BUY_COST, goldToNextInterest } from "@/lib/game/config";
import type { Hero } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";
import type { LineResult } from "@/lib/types";

/** A single, unambiguous "what to do now" prompt derived from the coach's best
 *  line plus the player's economy. Beginners always get one imperative line. */
export function nextStepText(best: LineResult | null, hero: Hero, cfg: LearnConfig): string {
  if (hero.hp < 35) {
    return "Health is low — add board power now (buy or upgrade, don't save).";
  }
  if (best) {
    const k = best.key;
    if (k.startsWith("roll")) return `Roll for upgrades — best line is "${best.label}".`;
    if (k.startsWith("level")) {
      return `Buy XP to reach level ${hero.level + 1} (${XP_BUY_COST}g each).`;
    }
    // save / econ
    const g2n = goldToNextInterest(hero.gold);
    if (hero.gold < 50 && g2n > 0) {
      return `Hold gold for interest — +1 more at ${hero.gold + g2n}g, then spend.`;
    }
    return "Your board can coast — bank gold and keep your economy rolling.";
  }
  const g2n = goldToNextInterest(hero.gold);
  return hero.gold < 50 && g2n > 0
    ? `Build economy — +1 interest at ${hero.gold + g2n}g.`
    : "Spend down your surplus — you're past the interest cap.";
}

export default function NextStep({
  best,
  hero,
  cfg,
}: {
  best: LineResult | null;
  hero: Hero;
  cfg: LearnConfig;
}) {
  const text = nextStepText(best, hero, cfg);
  const extra =
    cfg.label === "Pro" && best
      ? ` · EV ${best.ev_score.toFixed(2)}`
      : cfg.label !== "Beginner" && best
        ? ` · ${Math.round(best.top4_rate * 100)}% top-4`
        : "";
  return (
    <div className="card flex items-center gap-2.5 px-3 py-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand text-ink-950">✦</span>
      <span className="text-sm text-slate-100">
        {text}
        <span className="num text-xs text-slate-500">{extra}</span>
      </span>
    </div>
  );
}
