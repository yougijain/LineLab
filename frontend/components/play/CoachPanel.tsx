"use client";

import { useCallback, useEffect, useState } from "react";
import { compare } from "@/lib/api";
import type { CompareResponse, GameState } from "@/lib/types";
import type { LearnConfig } from "@/lib/game/tiers";
import { goldToNextInterest } from "@/lib/game/config";
import DecisionTree from "@/components/solver/DecisionTree";

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export default function CoachPanel({
  state,
  roundKey,
  cfg,
  onResult,
}: {
  state: GameState;
  roundKey: number; // changes each round -> auto refresh
  cfg: LearnConfig;
  onResult?: (data: CompareResponse) => void;
}) {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await compare(state, 1200);
      setData(data);
      onResult?.(data);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(state)]);

  useEffect(() => {
    if (auto) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, auto]);

  const best = data?.results.find((r) => r.key === data.best_key) ?? data?.results[0];
  const lines = data?.results.slice(0, cfg.coachLines) ?? [];
  const nudge =
    state.hp < 35
      ? "Low health — find board strength before you bleed out."
      : goldToNextInterest(state.gold) > 0 && state.gold < 50
        ? `+1 interest at ${state.gold + goldToNextInterest(state.gold)} gold.`
        : state.gold >= 50
          ? "Max interest — surplus gold can be spent freely."
          : "";

  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-ink-950">✦</span>
        <h3 className="text-sm font-semibold text-white">Coach</h3>
        <button
          onClick={() => setAuto((a) => !a)}
          className={`chip ml-auto ${auto ? "border-brand/40 text-brand" : ""}`}
        >
          auto {auto ? "on" : "off"}
        </button>
      </div>

      {loading && !data && <p className="mt-3 text-sm text-slate-400">Reading the spot…</p>}

      {best && (
        <>
          <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Best line</div>
            <div className="text-lg font-semibold text-white">{best.label}</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{best.explanation}</p>
          </div>

          {nudge && <p className="mt-2 text-xs text-amber-200/90">💡 {nudge}</p>}

          {cfg.coachLines > 1 && (
            <div className="mt-3 space-y-1.5">
              {lines.map((r, i) => (
                <div
                  key={r.key}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                    r.key === best.key ? "border-brand/40 bg-brand/5" : "border-ink-700"
                  }`}
                >
                  <span className="num w-4 text-slate-500">{i + 1}</span>
                  <span className="flex-1 truncate text-slate-200">{r.label}</span>
                  {cfg.coachMetrics && (
                    <span className="num text-slate-400">
                      {pct(r.top4_rate)} top4 · {r.expected_placement.toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {cfg.coachTree && best.branches.length > 0 && (
            <div className="mt-3">
              <DecisionTree line={best} />
            </div>
          )}
        </>
      )}

      {!auto && (
        <button onClick={run} disabled={loading} className="btn-ghost mt-3 text-sm">
          {loading ? "Reading…" : "Read this spot"}
        </button>
      )}
    </div>
  );
}
