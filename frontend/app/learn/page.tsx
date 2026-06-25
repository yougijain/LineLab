"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CORE_FUNDAMENTALS,
  MODULES,
  fundamentalsByModule,
} from "@/lib/learn/fundamentals";
import FundamentalCard from "@/components/learn/FundamentalCard";

export default function LearnPage() {
  const [deep, setDeep] = useState(false);

  return (
    <div className="py-8">
      {/* Hero */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-brand/40 text-brand">TFT fundamentals</span>
        <span className="chip">Patch-agnostic · works every set</span>
      </div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
        The handful of decisions that get you to{" "}
        <span className="text-brand">top 4</span>.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
        New to Teamfight Tactics? You don&rsquo;t need the meta — you need a few
        habits. These are the highest-leverage fundamentals, each a single rule
        you can use in your next game. Start with the six below.
      </p>

      {/* The must-know 6 */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Start here — the must-know 6
          </h2>
          <span className="num text-xs text-slate-500">{CORE_FUNDAMENTALS.length} cards</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_FUNDAMENTALS.map((f) => (
            <FundamentalCard key={f.id} f={f} />
          ))}
        </div>
      </section>

      {/* Go deeper */}
      <section className="mt-10">
        {!deep ? (
          <button
            onClick={() => setDeep(true)}
            className="btn-ghost w-full py-3 text-sm font-medium"
          >
            Go deeper — the full curriculum (8 more) ↓
          </button>
        ) : (
          <div className="space-y-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                The full curriculum
              </h2>
              <button
                onClick={() => setDeep(false)}
                className="text-xs text-slate-500 hover:text-white"
              >
                Collapse ↑
              </button>
            </div>
            {MODULES.map((m, i) => {
              const cards = fundamentalsByModule(m.id);
              return (
                <div key={m.id}>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm text-brand">{i + 1}</span>
                    <h3 className="font-semibold text-white">{m.title}</h3>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{m.goal}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((f) => (
                      <FundamentalCard key={f.id} f={f} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Practice CTA */}
      <section className="mt-12">
        <div className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">Now put it into reps</h2>
            <p className="mt-1 text-sm text-slate-400">
              The Arena is a practice auto-battler with a live coach that calls one
              move at a time — so you drill these habits, not memorize a guide.
            </p>
          </div>
          <Link href="/play" className="btn-primary px-5 py-2.5 text-sm">
            Practice in the Arena →
          </Link>
        </div>
      </section>
    </div>
  );
}
