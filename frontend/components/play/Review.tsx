"use client";

import { useEffect, useMemo, useState } from "react";
import { compare, reviewGame } from "@/lib/api";
import type { CompareResponse, MoveGrade, ReviewResponse } from "@/lib/types";
import type { DecisionRecord } from "@/lib/game/types";
import EVTable from "@/components/solver/EVTable";
import ExplanationPanel from "@/components/solver/ExplanationPanel";

function Sparkline({ grades }: { grades: MoveGrade[] }) {
  if (grades.length < 2) return null;
  const n = grades.length;
  const pts = grades.map((g, i) => {
    const x = (i / (n - 1)) * 100;
    const y = 30 - (g.quality / 100) * 27 - 1.5;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-16 w-full">
      <polyline points={`0,30 ${pts.join(" ")} 100,30`} fill="rgba(52,211,153,0.12)" stroke="none" />
      <polyline points={pts.join(" ")} fill="none" stroke="#34d399" strokeWidth="0.8" />
      {grades.map((g, i) => (
        <circle
          key={i}
          cx={(i / (n - 1)) * 100}
          cy={30 - (g.quality / 100) * 27 - 1.5}
          r="0.9"
          fill={g.label_color}
        />
      ))}
    </svg>
  );
}

export default function Review({
  decisions,
  placement,
  onPlayAgain,
}: {
  decisions: DecisionRecord[];
  placement: number;
  onPlayAgain: () => void;
}) {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<CompareResponse | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const payload = useMemo(
    () =>
      decisions.map((d) => ({
        state: d.pre,
        action_key: d.actionKey,
        action_label: d.actionLabel,
        stage_round: d.stageRound,
      })),
    [decisions],
  );

  useEffect(() => {
    let on = true;
    setLoading(true);
    reviewGame(payload, 600).then((r) => {
      if (on) {
        setReview(r);
        setLoading(false);
      }
    });
    return () => {
      on = false;
    };
  }, [payload]);

  const openMove = async (i: number) => {
    setSel(i);
    setDetail(null);
    const { data } = await compare(decisions[i].pre, 2000);
    setDetail(data);
    setDetailKey(data.best_key);
  };

  if (loading) {
    return (
      <div className="card grid h-64 place-items-center p-6 text-sm text-slate-400">
        Analyzing your {decisions.length} decisions against the solver…
      </div>
    );
  }
  if (!review) {
    return (
      <div className="card p-6 text-sm text-slate-400">
        Couldn&rsquo;t reach the solver to grade this game.{" "}
        <button onClick={onPlayAgain} className="link">Play again</button>
      </div>
    );
  }

  const placeColor = placement <= 4 ? "text-emerald-300" : "text-red-300";

  return (
    <div>
      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Finish</div>
            <div className={`num text-3xl font-bold ${placeColor}`}>#{placement}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Macro accuracy</div>
            <div className="num text-3xl font-bold text-white">
              {review.accuracy}
              <span className="ml-2 align-middle text-sm font-medium text-brand">{review.band}</span>
            </div>
          </div>
          <div className="min-w-[14rem] flex-1">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Main leak</div>
            <div className="text-sm text-slate-200">{review.main_leak}</div>
          </div>
          <button onClick={onPlayAgain} className="btn-primary px-5">Play again</button>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
            Decision quality over the game
          </div>
          <Sparkline grades={review.grades} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Move timeline */}
        <div className="card p-3">
          <h3 className="px-1 pb-2 text-sm font-semibold text-white">Line review</h3>
          <div className="space-y-1">
            {review.grades.map((g) => (
              <button
                key={g.index}
                onClick={() => openMove(g.index)}
                className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left ${
                  sel === g.index ? "border-brand/50 bg-ink-800" : "border-transparent hover:bg-ink-800/60"
                }`}
                style={{ borderLeft: `3px solid ${g.label_color}` }}
              >
                <span className="num w-9 text-xs text-slate-500">{g.stage_round}</span>
                <span className="flex-1 truncate text-sm text-slate-200">{g.played_label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: `${g.label_color}22`, color: g.label_color }}
                >
                  {g.label_name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail drawer */}
        <div className="space-y-4">
          {sel == null ? (
            <div className="card grid h-40 place-items-center p-5 text-sm text-slate-400">
              Pick a move to see what the solver preferred.
            </div>
          ) : (
            <>
              {(() => {
                const g = review.grades[sel];
                return (
                  <div className="card p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: `${g.label_color}22`, color: g.label_color }}
                      >
                        {g.label_name}
                      </span>
                      <span className="text-xs text-slate-400">{g.label_meaning}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">You played</div>
                        <div className="font-medium text-white">{g.played_label}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">Solver line</div>
                        <div className="font-medium text-brand">{g.best_label}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">EV lost</div>
                        <div className="num font-medium text-white">
                          {g.gap_place > 0 ? `${g.gap_place.toFixed(2)} place` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {detail ? (
                <>
                  <ExplanationPanel data={detail} />
                  <EVTable
                    results={detail.results}
                    bestKey={detail.best_key}
                    selectedKey={detailKey}
                    goal={detail.state.goal}
                    onSelect={setDetailKey}
                  />
                </>
              ) : (
                <div className="card grid h-24 place-items-center text-sm text-slate-400">
                  Loading the solver&rsquo;s full read…
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
