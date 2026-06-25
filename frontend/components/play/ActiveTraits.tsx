"use client";

import { activeTraits } from "@/lib/game/engine";
import { TEMPO_META, traitTempo } from "@/lib/game/data";
import type { Hero } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";

/** Simplified left-side strip: which traits are ACTIVE on your board right now,
 *  tagged only by tempo (Early / Scales / Late) — no bonus numbers. */
export default function ActiveTraits({ hero, cfg }: { hero: Hero; cfg: LearnConfig }) {
  const active = activeTraits(hero).filter((t) => t.activeBp > 0);
  const showCount = cfg.label !== "Beginner";

  return (
    <div className="card p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label">Active traits</span>
        <span className="num text-[10px] text-slate-500">{active.length}</span>
      </div>
      {active.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          None yet — field units that share a trait.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {active.map((t) => {
            const tempo = traitTempo(t.key);
            const meta = TEMPO_META[tempo];
            return (
              <div
                key={t.key}
                className="group relative flex items-center gap-2 rounded-md border border-ink-700 bg-ink-950/40 px-2 py-1"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="flex-1 truncate text-sm text-slate-200">
                  {t.name}
                  {showCount && <span className="num text-[11px] text-slate-500"> ×{t.count}</span>}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: `${meta.color}1f`, color: meta.color }}
                >
                  {meta.label}
                </span>
                {/* hover hint */}
                <div className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-48 rounded-md border border-ink-700 bg-ink-900 p-2 text-[11px] text-slate-300 shadow-lg group-hover:block">
                  {meta.hint}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
