"use client";

import { useState } from "react";
import { compare } from "@/lib/api";
import type { CompareResponse } from "@/lib/types";
import type { DecisionRecord } from "@/lib/game/types";
import EVTable from "@/components/solver/EVTable";
import ExplanationPanel from "@/components/solver/ExplanationPanel";

export default function History({
  decisions,
  onClose,
}: {
  decisions: DecisionRecord[];
  onClose: () => void;
}) {
  const [sel, setSel] = useState<DecisionRecord | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selKey, setSelKey] = useState<string | null>(null);

  const open = async (d: DecisionRecord) => {
    setSel(d);
    setData(null);
    setLoading(true);
    const { data } = await compare(d.pre, 1200);
    setData(data);
    setSelKey(data.best_key);
    setLoading(false);
  };

  const rows = [...decisions].reverse();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[min(560px,95vw)] flex-col border-l border-ink-700 bg-ink-950 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Turn history</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto">
          {rows.length === 0 && (
            <p className="text-sm text-slate-500">No decisions yet — play a round.</p>
          )}
          <div className="space-y-1">
            {rows.map((d) => (
              <button
                key={d.id}
                onClick={() => open(d)}
                className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left ${
                  sel?.id === d.id ? "border-brand/50 bg-ink-800" : "border-transparent hover:bg-ink-800/60"
                }`}
                style={d.grade ? { borderLeft: `3px solid ${d.grade.label_color}` } : undefined}
              >
                <span className="num w-9 text-xs text-slate-500">{d.stageRound}</span>
                <span className="flex-1 truncate text-sm text-slate-200">{d.actionLabel}</span>
                {d.grade ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: `${d.grade.label_color}22`, color: d.grade.label_color }}
                  >
                    {d.grade.label_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-600">…</span>
                )}
              </button>
            ))}
          </div>

          {/* detail */}
          {sel && (
            <div className="mt-4 space-y-3">
              {loading || !data ? (
                <div className="card grid h-24 place-items-center text-sm text-slate-400">
                  Re-reading {sel.stageRound}…
                </div>
              ) : (
                <>
                  <ExplanationPanel data={data} />
                  <EVTable
                    results={data.results}
                    bestKey={data.best_key}
                    selectedKey={selKey}
                    goal={data.state.goal}
                    onSelect={setSelKey}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
