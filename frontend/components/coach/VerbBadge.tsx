"use client";

import type { CompareResponse, GameState } from "@/lib/types";
import { verdictFromResult } from "@/lib/coach/verb";

// The one-verb answer. Big action word + plain-English why. Shared by the
// Solver (default view) and the Arena's Beginner coach.
export default function VerbBadge({
  data,
  state,
  loading = false,
  compact = false,
}: {
  data: CompareResponse | null;
  state: GameState;
  loading?: boolean;
  compact?: boolean;
}) {
  if (!data) {
    return (
      <div className="card grid place-items-center p-6 text-sm text-slate-400">
        {loading ? "Reading the spot…" : "No read yet."}
      </div>
    );
  }

  const v = verdictFromResult(data, state);
  const c = v.meta.color;

  return (
    <div
      className="card p-5"
      style={{ borderColor: `${c}59`, background: `linear-gradient(135deg, ${c}14, transparent)` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Do this now
        </span>
        {loading && <span className="num text-[11px] text-slate-500">updating…</span>}
      </div>

      <div
        className={`mt-1 font-bold leading-none tracking-tight ${compact ? "text-3xl" : "text-4xl md:text-5xl"}`}
        style={{ color: c }}
      >
        {v.verb}
      </div>

      <div className="mt-1.5 text-sm font-medium text-slate-200">{v.meta.gloss}</div>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{v.why}</p>

      {v.lineLabel && (
        <div className="mt-3">
          <span className="chip" style={{ borderColor: `${c}40`, color: c }}>
            {v.lineLabel}
          </span>
        </div>
      )}
    </div>
  );
}
