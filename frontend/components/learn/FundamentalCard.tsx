"use client";

import { useState } from "react";
import type { Fundamental } from "@/lib/learn/fundamentals";

export default function FundamentalCard({ f }: { f: Fundamental }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="card flex w-full flex-col p-4 text-left transition-colors hover:border-brand/40"
      aria-expanded={open}
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 text-base">
          {f.icon}
        </span>
        <div className="min-w-0">
          <div className="font-semibold leading-snug text-white">{f.title}</div>
        </div>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-slate-200">{f.rule}</p>

      {open ? (
        <div className="mt-3 space-y-2 border-t border-ink-700 pt-3">
          <div>
            <div className="label text-brand">Why it matters</div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{f.why}</p>
          </div>
          <div>
            <div className="label text-red-300/90">Common mistake</div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{f.mistake}</p>
          </div>
        </div>
      ) : (
        <span className="mt-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Tap for why + the mistake it fixes
        </span>
      )}
    </button>
  );
}
