"use client";

import type { GameState, Goal, Quality, StagePhase, Tri } from "@/lib/types";
import { Segmented, SliderField } from "./controls";

export type Precision = "fast" | "balanced" | "precise";

const tri = (l: string): { value: Tri; label: string }[] => [
  { value: "low", label: l === "q" ? "Weak" : "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

export default function ScenarioBuilder({
  state,
  setState,
  precision,
  setPrecision,
  onRun,
  onSave,
  loading,
}: {
  state: GameState;
  setState: (s: GameState) => void;
  precision: Precision;
  setPrecision: (p: Precision) => void;
  onRun: () => void;
  onSave: () => void;
  loading: boolean;
}) {
  const set = <K extends keyof GameState>(k: K, v: GameState[K]) =>
    setState({ ...state, [k]: v });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Scenario builder</h2>
        <button onClick={onSave} className="text-xs text-slate-400 hover:text-white">
          + Save spot
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <Segmented<Goal>
          label="Goal"
          value={state.goal}
          onChange={(v) => set("goal", v)}
          options={[
            { value: "top4", label: "Top 4" },
            { value: "first", label: "First" },
          ]}
          hint="what you're optimizing"
        />

        <Segmented<StagePhase>
          label="Stage"
          value={state.stage}
          onChange={(v) => set("stage", v)}
          options={[
            { value: "early", label: "Early" },
            { value: "midgame", label: "Mid" },
            { value: "late", label: "Late" },
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <SliderField label="Health" value={state.hp} min={1} max={100}
            onChange={(v) => set("hp", v)} />
          <SliderField label="Gold" value={state.gold} min={0} max={120}
            onChange={(v) => set("gold", v)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SliderField label="Level" value={state.level} min={1} max={9}
            onChange={(v) => set("level", v)} />
          <SliderField label="Pairs ready" value={state.pairs} min={0} max={6}
            onChange={(v) => set("pairs", v)} />
        </div>

        <Segmented<Quality>
          label="Board strength"
          value={state.board_strength}
          onChange={(v) => set("board_strength", v)}
          options={[
            { value: "weak", label: "Weak" },
            { value: "medium", label: "Med" },
            { value: "strong", label: "Strong" },
          ]}
          hint="relative to the lobby"
        />

        <div className="grid grid-cols-2 gap-4">
          <Segmented<Tri>
            label="Items"
            value={state.items}
            onChange={(v) => set("items", v)}
            options={tri("")}
          />
          <Segmented<Tri>
            label="Bench value"
            value={state.bench_value}
            onChange={(v) => set("bench_value", v)}
            options={tri("")}
          />
        </div>

        <Segmented<Tri>
          label="Lobby tempo"
          value={state.lobby_tempo}
          onChange={(v) => set("lobby_tempo", v)}
          options={tri("")}
          hint="how fast / strong the lobby is"
        />

        <div>
          <Segmented<Precision>
            label="Precision"
            value={precision}
            onChange={setPrecision}
            options={[
              { value: "fast", label: "Fast" },
              { value: "balanced", label: "Balanced" },
              { value: "precise", label: "Precise" },
            ]}
            hint="rollouts per line"
          />
        </div>

        <button
          onClick={onRun}
          disabled={loading}
          className="btn-primary w-full py-2.5 text-base"
        >
          {loading ? "Simulating…" : "Run solver"}
        </button>
      </div>
    </div>
  );
}
