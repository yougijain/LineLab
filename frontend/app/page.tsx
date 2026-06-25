import Link from "next/link";
import { MODULES } from "@/lib/learn/fundamentals";

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Teamfight Tactics fundamentals</Badge>
          <Badge>Learn by doing</Badge>
          <Badge>No meta to memorize</Badge>
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
          Learn the handful of TFT decisions that get you to{" "}
          <span className="text-brand">top 4</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          New players don&rsquo;t lose because they picked the wrong comp — they
          lose because they roll on impulse, field too few units, and let their
          carry die. LineLab teaches the few durable habits that fix that, then
          lets you drill them against a live coach.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/learn" className="btn-primary px-5 py-2.5 text-base">
            Learn the fundamentals →
          </Link>
          <Link href="/play" className="btn-ghost px-5 py-2.5 text-base">
            Practice in the Arena
          </Link>
        </div>
      </section>

      {/* What you'll learn */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          What you&rsquo;ll learn
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <div key={m.id} className="card p-5">
              <div className="num text-sm text-brand">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 font-semibold text-white">{m.title}</div>
              <p className="mt-1.5 text-sm text-slate-400">{m.goal}</p>
            </div>
          ))}
          <Link
            href="/learn"
            className="card flex items-center justify-center p-5 text-sm font-medium text-brand hover:border-brand/40"
          >
            See all the fundamentals →
          </Link>
        </div>
      </section>

      {/* Three ways to learn */}
      <section className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Three ways to get better
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
                ◆
              </span>
              <h3 className="font-semibold text-white">Learn</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Fourteen fundamentals, each a single rule you can use right now —
              with the common mistake it fixes. Start with the must-know six.
            </p>
            <Link href="/learn" className="link mt-4 inline-block text-sm">
              Read the fundamentals →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent">
                ▲
              </span>
              <h3 className="font-semibold text-white">Practice</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              The Arena is a playable auto-battler with a live coach that calls one
              move at a time — roll, level, save, or stabilize — so you drill the
              habits instead of reading about them.
            </p>
            <Link href="/play" className="link mt-4 inline-block text-sm">
              Open the Arena →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
                ✓
              </span>
              <h3 className="font-semibold text-white">Check a spot</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Stuck on a decision? The Solver reads any spot and gives you one
              move with a plain-English why — and the full expected-value math is
              one click away when you want it.
            </p>
            <Link href="/solver" className="link mt-4 inline-block text-sm">
              Try the Solver →
            </Link>
          </div>
        </div>
      </section>

      {/* How practice works */}
      <section className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          How the coach works
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Read the spot",
              d: "The app reads your health, gold, level, and board strength for you — you never have to rate your own board.",
            },
            {
              n: "02",
              t: "Get one move",
              d: "Thousands of fast simulated games collapse into a single recommended action: roll, level, save, or stabilize.",
            },
            {
              n: "03",
              t: "Learn the why",
              d: "Every call comes with a one-line reason tied to a fundamental, so the habit sticks. The numbers are there if you want them.",
            },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <div className="num text-sm text-brand">{s.n}</div>
              <div className="mt-1 font-semibold text-white">{s.t}</div>
              <p className="mt-1.5 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance strip */}
      <section className="mt-16">
        <div className="card border-ink-600 bg-ink-850 p-6">
          <h2 className="text-base font-semibold text-white">
            An independent learning tool
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            LineLab teaches universal TFT fundamentals using the game&rsquo;s own
            vocabulary — gold, interest, levels, rolls, traits, augments. It uses
            no Riot Games assets, artwork, champion data, or live-client access,
            and is not affiliated with or endorsed by Riot. The Arena and Solver
            run on an original simulation model.
          </p>
          <Link href="/compliance" className="link mt-3 inline-block text-sm">
            Read the compliance overview →
          </Link>
        </div>
      </section>
    </div>
  );
}
