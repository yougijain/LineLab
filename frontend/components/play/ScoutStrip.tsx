"use client";

import { poolContention, threatBand } from "@/lib/game/strength";
import type { Game } from "@/lib/game/types";

// Beginner-tier scouting, folded into one line: the toughest board in the
// lobby and whether your units are contested. Replaces the three richer
// panels (OpponentsRail / ThreatBoard / ScoutDrawer) shown at higher tiers.
const BAND = {
  Low: { text: "you're ahead", color: "#34d399" },
  Even: { text: "even", color: "#fbbf24" },
  High: { text: "dangerous", color: "#f87171" },
} as const;

export default function ScoutStrip({ game }: { game: Game }) {
  const alive = game.bots.filter((b) => b.alive);
  if (!alive.length) return null;
  const top = [...alive].sort((a, b) => b.strength - a.strength)[0];
  const band = BAND[threatBand(top.strength, game.hero)];
  const contested = poolContention(game).length;

  return (
    <div className="card flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 text-sm">
      <span className="flex items-center gap-1.5 text-slate-300">
        <span>🔭</span>
        <span className="font-medium">Scout</span>
      </span>
      <span className="text-slate-400">
        Toughest board:{" "}
        <span className="font-medium" style={{ color: band.color }}>
          {band.text}
        </span>
      </span>
      <span className="text-slate-400">
        {contested > 0 ? (
          <>
            <span className="font-medium text-amber-300">{contested}</span> of your units
            contested
          </>
        ) : (
          "your units aren't contested"
        )}
      </span>
    </div>
  );
}
