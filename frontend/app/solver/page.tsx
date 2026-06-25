"use client";

import { useCallback, useEffect, useState } from "react";
import {
  compare,
  deleteScenario,
  getScenarios,
  saveScenario,
} from "@/lib/api";
import type { CompareResponse, GameState, Scenario } from "@/lib/types";
import { DEFAULT_STATE } from "@/lib/types";
import ScenarioBuilder, { type Precision } from "@/components/solver/ScenarioBuilder";
import EVTable from "@/components/solver/EVTable";
import DecisionTree from "@/components/solver/DecisionTree";
import ExplanationPanel from "@/components/solver/ExplanationPanel";
import SavedScenarios from "@/components/solver/SavedScenarios";

const ROLLOUTS: Record<Precision, number> = {
  fast: 800,
  balanced: 1800,
  precise: 4500,
};

export default function SolverPage() {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [precision, setPrecision] = useState<Precision>("balanced");
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const runWith = useCallback(async (s: GameState, p: Precision) => {
    setLoading(true);
    try {
      const { data, offline: off } = await compare(s, ROLLOUTS[p]);
      setResult(data);
      setOffline(off);
      setSelectedKey(data.best_key);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: fetch teaching spots and run the default scenario.
  useEffect(() => {
    getScenarios().then(setScenarios);
    runWith(DEFAULT_STATE, "balanced");
  }, [runWith]);

  const onLoad = (sc: Scenario) => {
    setState(sc.state);
    runWith(sc.state, precision);
  };

  const onSave = async () => {
    const name = window.prompt("Name this spot:");
    if (!name) return;
    const sc = await saveScenario(name, "", state);
    if (sc) setScenarios((prev) => [...prev, sc]);
    else window.alert("Couldn't save — is the solver API running?");
  };

  const onDelete = async (id: string) => {
    if (await deleteScenario(id)) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const selectedLine =
    result?.results.find((r) => r.key === selectedKey) ?? null;

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          The Solver
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Describe a spot and compare your lines by expected placement. Original
          abstract auto-battler model — no third-party game data.
        </p>
      </div>

      {offline && (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          Solver API not reachable — showing a representative precomputed sample.
          Start the backend (<code className="num">uvicorn app.main:app</code>) and
          re-run for live simulations.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Left: builder + spots */}
        <div className="space-y-5">
          <ScenarioBuilder
            state={state}
            setState={setState}
            precision={precision}
            setPrecision={setPrecision}
            onRun={() => runWith(state, precision)}
            onSave={onSave}
            loading={loading}
          />
          <SavedScenarios scenarios={scenarios} onLoad={onLoad} onDelete={onDelete} />
        </div>

        {/* Right: results */}
        <div className="space-y-5">
          {result ? (
            <>
              <ExplanationPanel data={result} />
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">
                    Lines ranked by EV
                  </h2>
                  <span className="num text-xs text-slate-500">
                    {loading
                      ? "simulating…"
                      : `${result.elapsed_ms} ms${result.cached ? " · cached" : ""}`}
                  </span>
                </div>
                <EVTable
                  results={result.results}
                  bestKey={result.best_key}
                  selectedKey={selectedKey}
                  goal={result.state.goal}
                  onSelect={setSelectedKey}
                />
              </div>
              <DecisionTree line={selectedLine} />
            </>
          ) : (
            <div className="card grid h-64 place-items-center p-5 text-sm text-slate-400">
              {loading ? "Running the first simulation…" : "Build a spot and run the solver."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
