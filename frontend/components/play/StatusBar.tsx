"use client";

import {
  BASE_INCOME,
  INTEREST_CAP,
  MAX_LEVEL,
  XP_BUY_AMOUNT,
  XP_BUY_COST,
  XP_PASSIVE,
  XP_TO_NEXT,
  goldToNextInterest,
  interest,
  streakBonus,
} from "@/lib/game/config";
import { CONDITION_BY_KEY, TIER_COLOR } from "@/lib/game/conditions";
import type { DecisionGrade, Game } from "@/lib/game/types";
import type { LearnConfig } from "@/lib/game/tiers";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="num text-lg font-semibold leading-none">{children}</span>
    </div>
  );
}

export default function StatusBar({
  game,
  cfg,
  verdict,
}: {
  game: Game;
  cfg: LearnConfig;
  verdict?: DecisionGrade | null;
}) {
  const h = game.hero;
  const xpNeed = XP_TO_NEXT[h.level] ?? 0;
  const intr = interest(h.gold);
  const g2n = goldToNextInterest(h.gold);
  const maxLevel = h.level >= MAX_LEVEL;
  const detailed = cfg.label !== "Beginner";
  const pro = cfg.label === "Pro";

  return (
    <div className="card px-4 py-2.5">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
        <Stat label="Health">
          <span className="text-emerald-300">{Math.max(0, Math.round(h.hp))}</span>
        </Stat>

        {/* Gold + interest */}
        <div>
          <Stat label="Gold">
            <span className="text-amber-300">{h.gold}</span>
          </Stat>
          {cfg.showInterestDots && (
            <>
              <div className="mt-1 flex items-center gap-1">
                {[10, 20, 30, 40, 50].map((b) => (
                  <span
                    key={b}
                    className={`h-1.5 w-1.5 rounded-full ${h.gold >= b ? "bg-amber-300" : "bg-ink-700"}`}
                  />
                ))}
              </div>
              <div className="num mt-0.5 text-[10px] text-slate-500">
                Interest +{intr}
                {h.gold >= 50
                  ? ` (capped +${INTEREST_CAP})`
                  : g2n > 0
                    ? ` · +1 at ${h.gold + g2n}g`
                    : ""}
              </div>
              {detailed && (
                <div className="num text-[10px] text-slate-600">
                  Next: +{BASE_INCOME}+{intr}+{streakBonus(h.streak)} = {BASE_INCOME + intr + streakBonus(h.streak)}g
                </div>
              )}
            </>
          )}
        </div>

        {/* Level + XP */}
        <div>
          <Stat label="Level">{h.level}</Stat>
          {!maxLevel ? (
            <>
              <div className="mt-1 h-1 w-24 overflow-hidden rounded bg-ink-700">
                <div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, (h.xp / xpNeed) * 100)}%` }} />
              </div>
              <div className="num mt-0.5 text-[10px] text-slate-500">
                {h.xp}/{xpNeed} XP → L{h.level + 1}
              </div>
              {detailed && (
                <div className="num text-[10px] text-slate-600">
                  Buy XP {XP_BUY_COST}g → +{XP_BUY_AMOUNT}{pro ? ` · passive +${XP_PASSIVE}/rd` : ""}
                </div>
              )}
            </>
          ) : (
            <div className="num mt-1 text-[10px] text-slate-500">Max level</div>
          )}
        </div>

        {cfg.showStreak && (
          <Stat label="Streak">
            <span className={h.streak >= 0 ? "text-emerald-300" : "text-red-300"}>
              {h.streak > 0 ? `+${h.streak}` : h.streak}
            </span>
          </Stat>
        )}

        <div className="ml-auto flex items-center gap-3">
          {verdict && (
            <span
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{ borderColor: verdict.label_color, color: verdict.label_color }}
              title={
                verdict.best_label === verdict.played_label
                  ? "Best line."
                  : `Better: ${verdict.best_label}`
              }
            >
              Last move: {verdict.label_name}
            </span>
          )}
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Stage</span>
            <div className="num text-lg font-semibold">
              {game.stage}-{game.roundInStage + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Active conditions strip */}
      {(() => {
        const mods = game.conditions.modifiers
          .map((k) => CONDITION_BY_KEY[k])
          .filter((d): d is NonNullable<typeof d> => !!d)
          .filter((d) => detailed || d.category === "econ"); // Beginner: econ only
        const eventDef = game.conditions.event ? CONDITION_BY_KEY[game.conditions.event] : null;
        if (mods.length === 0 && (!eventDef || !detailed)) return null;
        return (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-ink-700 pt-2">
            {mods.map((d) => (
              <span
                key={d.key}
                className="rounded-full border px-2 py-0.5 text-[10px]"
                style={{ borderColor: `${TIER_COLOR[d.tier]}66`, color: TIER_COLOR[d.tier] }}
                title={d.blurb}
              >
                {d.name}
              </span>
            ))}
            {detailed && eventDef && (
              <span className="chip border-amber-500/40 text-amber-300" title={eventDef.blurb}>
                Stage: {eventDef.name}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
