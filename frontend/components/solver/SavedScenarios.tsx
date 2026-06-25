"use client";

import type { Scenario } from "@/lib/types";

export default function SavedScenarios({
  scenarios,
  onLoad,
  onDelete,
}: {
  scenarios: Scenario[];
  onLoad: (s: Scenario) => void;
  onDelete: (id: string) => void;
}) {
  const builtins = scenarios.filter((s) => s.builtin);
  const saved = scenarios.filter((s) => !s.builtin);

  const Item = ({ s }: { s: Scenario }) => (
    <div className="group flex items-start gap-2 rounded-lg border border-ink-700 bg-ink-950/40 p-3">
      <button onClick={() => onLoad(s)} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium text-white group-hover:text-brand">
          {s.name}
        </div>
        {s.description && (
          <div className="mt-0.5 line-clamp-2 text-xs text-slate-400">{s.description}</div>
        )}
      </button>
      {!s.builtin && (
        <button
          onClick={() => onDelete(s.id)}
          className="text-xs text-slate-500 hover:text-red-400"
          aria-label="Delete scenario"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-white">Teaching spots</h2>
      <div className="mt-3 space-y-2">
        {builtins.map((s) => (
          <Item key={s.id} s={s} />
        ))}
      </div>
      {saved.length > 0 && (
        <>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your saved spots
          </h3>
          <div className="mt-2 space-y-2">
            {saved.map((s) => (
              <Item key={s.id} s={s} />
            ))}
          </div>
        </>
      )}
      {scenarios.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Connect the solver API to load teaching spots, or build one on the left.
        </p>
      )}
    </div>
  );
}
