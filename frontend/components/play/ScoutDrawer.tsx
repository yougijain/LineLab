"use client";

import { TRAITS_BY_KEY } from "@/lib/game/data";
import { threatBand } from "@/lib/game/strength";
import type { Bot, Hero } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";
import Board from "./Board";

const THREAT_COLOR: Record<string, string> = { High: "#f87171", Even: "#fbbf24", Low: "#34d399" };

export default function ScoutDrawer({
  bot,
  hero,
  cfg,
  onClose,
}: {
  bot: Bot;
  hero: Hero;
  cfg: LearnConfig;
  onClose: () => void;
}) {
  const tier = cfg.label;
  const band = threatBand(bot.strength, hero);
  const showBoard = tier !== "Beginner";
  const showEcon = tier === "Pro";
  const activeTraits = Object.entries(bot.board.traits)
    .filter(([k, c]) => {
      const def = TRAITS_BY_KEY[k];
      if (!def) return false;
      const first = Math.min(...Object.keys(def.breakpoints).map(Number));
      return c >= first;
    })
    .sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[min(420px,95vw)] flex-col border-l border-ink-700 bg-ink-950 p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-700 font-mono text-sm font-bold text-slate-200">
            {bot.name[0]}
          </div>
          <div>
            <div className="font-semibold text-white">{bot.name}</div>
            <div className="text-xs text-slate-400">{bot.board.identityLabel}</div>
          </div>
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: `${THREAT_COLOR[band]}22`, color: THREAT_COLOR[band] }}
          >
            {band} threat
          </span>
          <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="mt-2 text-xs text-slate-400">{bot.board.buildLine}</p>

        {showBoard && (
          <div className="mt-3 card p-2">
            <Board hero={{ board: bot.board.units } as unknown as Hero} readOnly />
          </div>
        )}

        {showBoard && activeTraits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeTraits.map(([k, c]) => (
              <span key={k} className="chip border-brand/40 text-brand">
                {TRAITS_BY_KEY[k]?.name ?? k} {c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">HP {Math.max(0, Math.round(bot.hp))}</span>
          {showBoard && <span className="chip">{bot.board.itemCount} items</span>}
          {showEcon && <span className="chip">Level {bot.board.level}</span>}
          {showEcon && (
            <span className="chip">
              Streak {bot.streak > 0 ? `+${bot.streak}` : bot.streak}
            </span>
          )}
        </div>

        {tier === "Beginner" && (
          <p className="mt-4 text-xs text-slate-500">
            Reach Standard tier to see opponents&rsquo; full boards and items.
          </p>
        )}
      </div>
    </>
  );
}
