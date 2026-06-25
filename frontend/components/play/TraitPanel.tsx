"use client";

import { activeTraits } from "@/lib/game/engine";
import { traitWants } from "@/lib/game/data";
import type { Hero } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";

export default function TraitPanel({ hero, cfg }: { hero: Hero; cfg: LearnConfig }) {
  const traits = activeTraits(hero);
  if (traits.length === 0) {
    return <div className="text-xs text-slate-500">Field units to activate traits.</div>;
  }
  const showNearMiss = cfg.label !== "Beginner";

  return (
    <div className="flex flex-wrap gap-2">
      {traits.map((t) => {
        const active = t.activeBp > 0;
        return (
          <div
            key={t.key}
            className={`group relative rounded-lg border px-2.5 py-1.5 ${
              active ? "border-brand/40 bg-brand/5" : "border-ink-700"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${active ? "text-brand" : "text-slate-300"}`}>
                {t.name}
              </span>
              {/* breakpoint pips */}
              <span className="flex gap-0.5">
                {t.breakpoints.map((bp) => (
                  <span
                    key={bp}
                    className={`h-1.5 w-1.5 rounded-full ${t.count >= bp ? "bg-brand" : "bg-ink-600"}`}
                    title={`${bp}`}
                  />
                ))}
              </span>
              <span className="num text-[11px] text-slate-400">{t.count}</span>
              {active && <span className="num text-[11px] text-brand">+{t.activeBonus}</span>}
            </div>
            {showNearMiss && t.toNext != null && t.toNext <= 2 && (
              <div className="mt-0.5 text-[10px] text-amber-200/90">
                {t.toNext} more → +{t.nextBonus} {t.name}
              </div>
            )}
            {/* hover blurb */}
            <div className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-52 rounded-md border border-ink-700 bg-ink-900 p-2 text-[11px] text-slate-300 shadow-lg group-hover:block">
              {traitWants(t.key)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
