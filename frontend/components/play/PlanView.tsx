"use client";

import { useEffect, useState } from "react";
import { project } from "@/lib/api";
import type { GameState, ProjectResponse } from "@/lib/types";
import Sparkline from "./Sparkline";

function survColor(s: number) {
  return s > 0.7 ? "#34d399" : s > 0.4 ? "#fbbf24" : "#f87171";
}

export default function PlanView({
  state,
  lineKey,
}: {
  state: GameState;
  lineKey: string;
}) {
  const [data, setData] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    project(state, lineKey, 2000).then((r) => {
      if (on) {
        setData(r);
        setLoading(false);
      }
    });
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(state), lineKey]);

  if (loading && !data) {
    return <p className="mt-3 text-sm text-slate-400">Projecting the line forward…</p>;
  }
  if (!data) {
    return <p className="mt-3 text-sm text-slate-500">Projection unavailable.</p>;
  }

  return (
    <div className="mt-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        If you play &ldquo;{data.line_label}&rdquo;
      </div>

      {/* HP sparkline */}
      <div className="mt-1">
        <Sparkline values={data.trajectory.map((t) => t.exp_hp)} max={100} color="#34d399" />
      </div>

      {/* trajectory table */}
      <div className="mt-2 grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 text-xs">
        <div className="text-[10px] uppercase text-slate-500">Stage</div>
        <div className="text-right text-[10px] uppercase text-slate-500">HP</div>
        <div className="text-right text-[10px] uppercase text-slate-500">Place</div>
        <div className="text-right text-[10px] uppercase text-slate-500">Surv</div>
        {data.trajectory.map((t) => (
          <ProjRow key={t.stage} stage={t.stage} hp={t.exp_hp} place={t.exp_placement} surv={t.survival} />
        ))}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-amber-200/90">💡 {data.watch_next}</p>
      <div className="mt-2 flex gap-2 text-[11px]">
        <span className="chip">final ~{data.final_placement.toFixed(1)}</span>
        <span className="chip">top-4 {Math.round(data.top4_rate * 100)}%</span>
      </div>
    </div>
  );
}

function ProjRow({ stage, hp, place, surv }: { stage: number; hp: number; place: number; surv: number }) {
  return (
    <>
      <div className="num text-slate-300">Stage {stage}</div>
      <div className="num text-right text-slate-300">{Math.round(hp)}</div>
      <div className="num text-right text-slate-300">{place.toFixed(1)}</div>
      <div className="num text-right" style={{ color: survColor(surv) }}>
        {Math.round(surv * 100)}%
      </div>
    </>
  );
}
