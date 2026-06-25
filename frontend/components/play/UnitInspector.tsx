"use client";

import { useEffect } from "react";
import {
  MODULES_BY_KEY,
  TIER_COLORS,
  TRAITS_BY_KEY,
  activeBreakpoint,
  itemBestOn,
  unitWants,
} from "@/lib/game/data";
import { ITEM_SLOTS_PER_UNIT, STAR_MULT, TIER_BASE, TIER_COST } from "@/lib/game/config";
import { fieldedTraitCounts, unitStrength } from "@/lib/game/strength";
import type { FieldUnit, Hero } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";

const ROMAN = ["I", "II", "III", "IV", "V"];
const CLASS_COLOR: Record<string, string> = {
  offensive: "#fbbf24",
  defensive: "#38bdf8",
  utility: "#a78bfa",
};

export default function UnitInspector({
  unit,
  anchor,
  hero,
  cfg,
  onClose,
}: {
  unit: FieldUnit;
  anchor: DOMRect;
  hero: Hero;
  cfg: LearnConfig;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const width = 280;
  const left = Math.min(Math.max(8, anchor.left), window.innerWidth - width - 8);
  const top = Math.min(anchor.bottom + 6, window.innerHeight - 240);

  const counts = fieldedTraitCounts(hero.board);
  const base = (TIER_BASE[unit.tier] ?? 6) * (STAR_MULT[unit.star] ?? 1);
  const itemSum = unit.items.reduce((s, m) => s + (MODULES_BY_KEY[m]?.strength ?? 0), 0);
  const total = unitStrength(unit);
  const isPro = cfg.label === "Pro";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="card fixed z-50 p-3 text-sm shadow-xl"
        style={{ left, top, width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold num"
            style={{ background: `${TIER_COLORS[unit.tier]}33`, color: TIER_COLORS[unit.tier] }}
          >
            {ROMAN[unit.tier - 1]}
          </span>
          <span className="font-semibold text-white">{unit.name}</span>
          <span className="num text-[11px] text-amber-300">{"★".repeat(unit.star)}</span>
          <span className="num ml-auto text-[11px] text-slate-400">{TIER_COST[unit.tier]}g · {unit.role}</span>
        </div>

        {/* Traits */}
        <div className="mt-2 flex flex-wrap gap-1">
          {unit.traits.map((t) => {
            const c = counts[t] ?? 0;
            const active = activeBreakpoint(t, c) > 0;
            return (
              <span
                key={t}
                className={`chip ${active ? "border-brand/40 text-brand" : "text-slate-400"}`}
              >
                {TRAITS_BY_KEY[t]?.name ?? t}{c > 0 ? ` ${c}` : ""}
              </span>
            );
          })}
        </div>

        {/* Items */}
        {cfg.showItems && (
          <div className="mt-2">
            <div className="label">Modules</div>
            <div className="mt-1 space-y-1">
              {unit.items.map((m, i) => {
                const mod = MODULES_BY_KEY[m];
                return (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-sm" style={{ background: CLASS_COLOR[mod?.itemClass ?? "utility"] }} />
                    <span className="text-slate-200">{mod?.name}</span>
                    <span className="num text-slate-500">+{mod?.strength}</span>
                  </div>
                );
              })}
              {Array.from({ length: ITEM_SLOTS_PER_UNIT - unit.items.length }).map((_, i) => (
                <div key={`e${i}`} className="text-xs text-slate-600">▢ empty slot</div>
              ))}
            </div>
          </div>
        )}

        {/* Power */}
        <div className="mt-2 flex items-baseline justify-between">
          <span className="label">Power</span>
          <span className="num font-semibold text-white">
            {isPro ? `${Math.round(base)} base · +${Math.round(itemSum)} items = ` : ""}
            {Math.round(total)}
          </span>
        </div>

        {/* Wants */}
        <p className="mt-2 border-t border-ink-700 pt-2 text-xs leading-relaxed text-slate-300">
          {unitWants(unit.key)}
        </p>
      </div>
    </>
  );
}
