"use client";

import type { LineResult } from "@/lib/types";

function place(n: number) {
  return n.toFixed(2);
}

export default function DecisionTree({ line }: { line: LineResult | null }) {
  if (!line) {
    return (
      <div className="card p-5 text-sm text-slate-400">
        Select a line to inspect its decision tree.
      </div>
    );
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Decision tree · {line.label}</h3>
        <span className="text-[11px] text-slate-500">next-fight outcomes</span>
      </div>

      {/* Root */}
      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-center">
          <div className="text-xs text-slate-300">Play this line</div>
          <div className="num text-sm font-semibold text-white">
            avg {place(line.expected_placement)}
          </div>
        </div>

        <div className="h-5 w-px bg-ink-600" />
        <div className="flex w-full">
          {line.branches.map((b, i) => {
            const win = b.label.toLowerCase().includes("win");
            return (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div className="h-px w-full bg-ink-600" />
                <div className="h-5 w-px bg-ink-600" />
                <div
                  className={`w-full rounded-lg border px-3 py-2.5 text-center ${
                    win
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="text-xs font-medium text-slate-200">{b.label}</div>
                  <div className="num mt-1 text-lg font-semibold text-white">
                    {Math.round(b.prob * 100)}%
                  </div>
                  <div className="num text-xs text-slate-400">
                    then avg {place(b.expected_placement)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        The split shows how often this line wins the very next combat and the
        average placement that follows each branch — a one-ply read on the line&rsquo;s
        immediate risk.
      </p>
    </div>
  );
}
