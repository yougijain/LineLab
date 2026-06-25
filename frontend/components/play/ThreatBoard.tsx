"use client";

import { poolContention } from "@/lib/game/strength";
import type { Game } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";

export default function ThreatBoard({ game, cfg }: { game: Game; cfg: LearnConfig }) {
  const alive = game.bots.filter((b) => b.alive);
  if (!alive.length) return null;
  const top = [...alive].sort((a, b) => b.strength - a.strength)[0];
  const contention = poolContention(game);
  const beginner = cfg.label === "Beginner";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="chip border-red-500/30 text-red-300">
        Top threat: {top.name} ({top.board.identityLabel})
      </span>
      {beginner
        ? contention.length > 0 && <span className="chip border-amber-500/30 text-amber-300">Your units are contested</span>
        : contention.slice(0, 3).map((c) => (
            <span
              key={c.key}
              className="chip border-amber-500/30 text-amber-300"
              title={`Held by ${c.rivals.join(", ")}`}
            >
              {c.name} contested ×{c.rivalCopies}
            </span>
          ))}
    </div>
  );
}
