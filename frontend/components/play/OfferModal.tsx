"use client";

import { useEffect } from "react";
import { CONDITION_BY_KEY, TIER_COLOR } from "@/lib/game/conditions";

export default function OfferModal({
  offer,
  onPick,
  hint,
}: {
  offer: string[];
  onPick: (key: string) => void;
  hint?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < offer.length) onPick(offer[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [offer, onPick]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="card w-full max-w-2xl p-6">
        <h2 className="text-lg font-semibold text-white">Choose a modifier</h2>
        <p className="mt-1 text-sm text-slate-400">
          A run-long boost. Pick one (press 1–{offer.length}).
        </p>
        {hint && (
          <p className="mt-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand">
            💡 {hint}
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {offer.map((key, i) => {
            const def = CONDITION_BY_KEY[key];
            if (!def) return null;
            return (
              <button
                key={key}
                onClick={() => onPick(key)}
                className="card group flex flex-col p-4 text-left transition-colors hover:border-brand/50"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                    style={{ background: `${TIER_COLOR[def.tier]}22`, color: TIER_COLOR[def.tier] }}
                  >
                    {def.tier}
                  </span>
                  <span className="num text-xs text-slate-600">{i + 1}</span>
                </div>
                <div className="mt-2 font-semibold text-white">{def.name}</div>
                <div className="label mt-0.5">{def.category}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{def.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
