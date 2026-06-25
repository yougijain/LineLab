"use client";

import { ROSTER_BY_KEY, TIER_COLORS } from "@/lib/game/data";
import { SHOP_ODDS, TIER_COST } from "@/lib/game/config";
import type { Hero } from "@/lib/game/types";

export default function Shop({
  hero,
  onBuy,
  onRefresh,
  onBuyXP,
  onLock,
  busy,
  showOdds,
}: {
  hero: Hero;
  onBuy: (slot: number) => void;
  onRefresh: () => void;
  onBuyXP: () => void;
  onLock: () => void;
  busy?: boolean;
  showOdds?: boolean;
}) {
  return (
    <div className="card border-t-2 border-t-brand/30 p-3">
      <div className="grid grid-cols-5 gap-2">
        {hero.shop.map((key, i) => {
          if (!key) return <div key={i} className="cell h-16 bg-ink-950/40" />;
          const def = ROSTER_BY_KEY[key];
          const cost = TIER_COST[def.tier];
          const afford = hero.gold >= cost;
          return (
            <button
              key={i}
              onClick={() => afford && onBuy(i)}
              disabled={!afford || busy}
              className={`unit tier-${def.tier} h-16 ${!afford ? "opacity-50" : "hover:-translate-y-0.5"} transition-transform`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-[11px] font-semibold text-white">{def.name}</span>
                <span className="num text-[11px] text-amber-300">{cost}g</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {def.traits.map((t) => (
                  <span key={t} className="rounded bg-ink-950/50 px-1 text-[8px] text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {showOdds && (
        <div className="num mt-1.5 text-[10px] text-slate-500">
          Lv{hero.level} odds —{" "}
          {["I", "II", "III", "IV", "V"].map((r, i) => (
            <span key={r} style={{ color: TIER_COLORS[i + 1] }} className="mr-2">
              {r} {Math.round((SHOP_ODDS[hero.level]?.[i] ?? 0) * 100)}%
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button onClick={onRefresh} disabled={hero.gold < 2 || busy} className="btn-ghost text-sm">
          ↻ Refresh <span className="num text-amber-300">2g</span>
        </button>
        <button onClick={onBuyXP} disabled={hero.gold < 4 || hero.level >= 9 || busy} className="btn-ghost text-sm">
          ▲ Buy XP <span className="num text-amber-300">4g</span>
        </button>
        <button onClick={onLock} disabled={busy} className="btn-primary ml-auto px-6 text-sm">
          {busy ? "Fighting…" : "Ready — fight ▶"}
        </button>
      </div>
    </div>
  );
}
