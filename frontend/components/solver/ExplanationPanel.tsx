"use client";

import type { CompareResponse } from "@/lib/types";

export default function ExplanationPanel({ data }: { data: CompareResponse }) {
  const best = data.results.find((r) => r.key === data.best_key) ?? data.results[0];
  return (
    <div className="card border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-ink-950">
          ✓
        </span>
        <h3 className="text-sm font-semibold text-white">Recommendation</h3>
        <span className="num ml-auto text-xs text-slate-400">
          {data.n_rollouts.toLocaleString()} rollouts/line
        </span>
      </div>
      <div className="mt-3 text-xl font-semibold text-white">{best.label}</div>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{data.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="chip">avg {best.expected_placement.toFixed(2)}</span>
        <span className="chip">top-4 {Math.round(best.top4_rate * 100)}%</span>
        <span className="chip">first {Math.round(best.first_rate * 100)}%</span>
        <span className="chip">risk {best.risk.toFixed(2)}</span>
      </div>
    </div>
  );
}
