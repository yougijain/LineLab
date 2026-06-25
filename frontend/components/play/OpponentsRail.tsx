"use client";

import type { Bot } from "@/lib/game/types";

export default function OpponentsRail({
  bots,
  nextOpponent,
  onScout,
}: {
  bots: Bot[];
  nextOpponent?: string | null;
  onScout?: (id: string) => void;
}) {
  const sorted = [...bots].sort((a, b) => Number(b.alive) - Number(a.alive) || b.hp - a.hp);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {sorted.map((b) => {
        const isNext = b.id === nextOpponent && b.alive;
        return (
          <button
            key={b.id}
            onClick={() => b.alive && onScout?.(b.id)}
            disabled={!b.alive}
            title={b.alive ? `Scout ${b.name}` : `${b.name} — out`}
            className={`card flex w-16 shrink-0 flex-col items-center gap-1 p-1.5 text-center ${
              !b.alive ? "opacity-35" : isNext ? "ring-1 ring-brand/60 hover:ring-brand" : "hover:ring-1 hover:ring-brand/40"
            }`}
          >
            <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 font-mono text-[11px] font-bold text-slate-200">
              {b.name[0]}
            </div>
            <div className="truncate text-[10px] text-slate-300">{b.name}</div>
            <div className="h-1 w-full overflow-hidden rounded bg-ink-700">
              <div
                className={`h-full ${b.hp > 30 ? "bg-emerald-400" : "bg-red-400"}`}
                style={{ width: `${Math.max(0, Math.min(100, b.hp))}%` }}
              />
            </div>
            <div className="num text-[9px] text-slate-500">
              {b.alive ? Math.max(0, Math.round(b.hp)) : `#${b.placement}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
