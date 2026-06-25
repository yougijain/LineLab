"use client";

import { useState } from "react";
import { BOT_DIFFICULTIES, LEARN_TIERS } from "@/lib/game/tiers";
import type { Goal, LearnTier, Settings } from "@/lib/game/types";

const LEARN_ORDER: LearnTier[] = ["beginner", "standard", "pro"];

export default function SetupScreen({ onStart }: { onStart: (s: Settings) => void }) {
  const [learnTier, setLearnTier] = useState<LearnTier>("standard");
  const [botDiff, setBotDiff] = useState("ranked");
  const [goal, setGoal] = useState<Goal>("top4");
  const [pairedHint, setPairedHint] = useState(true);

  const cfg = LEARN_TIERS[learnTier];

  const pickLearn = (t: LearnTier) => {
    setLearnTier(t);
    if (pairedHint) setBotDiff(LEARN_TIERS[t].suggestedBot);
  };

  return (
    <div className="grid min-h-[60vh] place-items-center py-10">
      <div className="card w-full max-w-xl p-6">
        <h1 className="text-xl font-semibold text-white">New game</h1>
        <p className="mt-1 text-sm text-slate-400">
          Two independent dials: how much the interface teaches you, and how tough
          the lobby plays.
        </p>

        {/* Learning tier */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="label">Your learning tier</span>
            <span className="text-[11px] text-slate-500">UI &amp; coaching depth</span>
          </div>
          <div className="mt-1.5 flex rounded-lg border border-ink-700 bg-ink-950/50 p-0.5">
            {LEARN_ORDER.map((t) => (
              <button
                key={t}
                onClick={() => pickLearn(t)}
                className={`seg flex-1 ${learnTier === t ? "seg-on" : "seg-off"}`}
              >
                {LEARN_TIERS[t].label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">{cfg.blurb}</p>
        </div>

        {/* Bot difficulty */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="label">Bot difficulty</span>
            <span className="text-[11px] text-slate-500">opponent strength</span>
          </div>
          <div className="mt-1.5 flex rounded-lg border border-ink-700 bg-ink-950/50 p-0.5">
            {BOT_DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                onClick={() => {
                  setBotDiff(d.key);
                  setPairedHint(d.key === cfg.suggestedBot);
                }}
                className={`seg flex-1 ${botDiff === d.key ? "seg-on !bg-indigo-400 !text-ink-950" : "seg-off"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {BOT_DIFFICULTIES.find((d) => d.key === botDiff)?.blurb}
            {botDiff !== cfg.suggestedBot && (
              <button
                onClick={() => { setBotDiff(cfg.suggestedBot); setPairedHint(true); }}
                className="link ml-2"
              >
                use suggested ({BOT_DIFFICULTIES.find((d) => d.key === cfg.suggestedBot)?.label})
              </button>
            )}
          </p>
        </div>

        {/* Goal */}
        <div className="mt-5">
          <span className="label">Goal</span>
          <div className="mt-1.5 flex rounded-lg border border-ink-700 bg-ink-950/50 p-0.5">
            {(["top4", "first"] as Goal[]).map((gKey) => (
              <button
                key={gKey}
                onClick={() => setGoal(gKey)}
                disabled={cfg.lockGoalTop4 && gKey === "first"}
                className={`seg flex-1 ${goal === gKey ? "seg-on" : "seg-off"} ${
                  cfg.lockGoalTop4 && gKey === "first" ? "opacity-40" : ""
                }`}
              >
                {gKey === "top4" ? "Top 4" : "First"}
              </button>
            ))}
          </div>
          {cfg.lockGoalTop4 && (
            <p className="mt-1 text-[11px] text-slate-500">First-place play unlocks at Standard tier.</p>
          )}
        </div>

        <button
          onClick={() =>
            onStart({ learnTier, botDiff, goal, seed: Math.floor(Math.random() * 2 ** 31) })
          }
          className="btn-primary mt-7 w-full py-2.5 text-base"
        >
          Start game →
        </button>
      </div>
    </div>
  );
}
