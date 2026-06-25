"use client";

import type { Goal, LineResult } from "@/lib/types";
import PlacementBar from "./PlacementBar";

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`num text-sm ${emphasize ? "font-semibold text-white" : "text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}

export default function EVTable({
  results,
  bestKey,
  selectedKey,
  goal,
  onSelect,
}: {
  results: LineResult[];
  bestKey: string;
  selectedKey: string | null;
  goal: Goal;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      {results.map((r, i) => {
        const isBest = r.key === bestKey;
        const isSelected = r.key === selectedKey;
        return (
          <button
            key={r.key}
            onClick={() => onSelect(r.key)}
            className={`card w-full p-4 text-left transition-colors ${
              isSelected ? "border-brand/60 ring-1 ring-brand/40" : "hover:border-ink-600"
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Line + explanation */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[11px] num ${
                      isBest ? "bg-brand text-ink-950" : "bg-ink-700 text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold text-white">{r.label}</span>
                  {isBest && (
                    <span className="chip border-brand/40 text-brand">
                      {goal === "first" ? "Best for 1st" : "Best line"}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{r.explanation}</p>
              </div>

              {/* Metrics */}
              <div className="grid shrink-0 grid-cols-5 gap-4 md:w-[330px]">
                <Metric label="Avg" value={r.expected_placement.toFixed(2)} emphasize />
                <Metric label="Top 4" value={pct(r.top4_rate)} />
                <Metric label="First" value={pct(r.first_rate)} />
                <Metric label="Bot 4" value={pct(r.bot4_rate)} />
                <Metric label="Risk" value={r.risk.toFixed(2)} />
              </div>
            </div>
            <div className="mt-3">
              <PlacementBar distribution={r.distribution} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
