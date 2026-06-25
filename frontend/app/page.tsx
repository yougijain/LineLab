import Link from "next/link";

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Original decision-theory engine</Badge>
          <Badge>Monte Carlo · expected value</Badge>
          <Badge>No game-publisher IP</Badge>
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
          A <span className="text-brand">solver</span> for auto-battler
          <br className="hidden md:block" /> macro decisions.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
          Think of it as a poker solver for the economy game. Describe a spot —
          health, gold, level, board strength, tempo — and LineLab runs thousands
          of Monte Carlo games to compare your lines by{" "}
          <span className="text-white">expected placement</span>, top-4 rate, and
          risk. It teaches the <em>why</em>, not just the move.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/solver" className="btn-primary px-5 py-2.5 text-base">
            Open the Solver →
          </Link>
          <Link href="/study" className="btn-ghost px-5 py-2.5 text-base">
            TFT Study (preview)
          </Link>
        </div>
      </section>

      {/* Two products */}
      <section className="grid gap-5 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand/15 text-brand">
              ◆
            </span>
            <h2 className="text-lg font-semibold text-white">LineLab Solver</h2>
            <span className="chip ml-auto border-brand/40 text-brand">Live</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            An original auto-battler EV engine. It models a generic, fictional
            game — invented units, traits and stat modules — so it can teach
            transferable macro skills without recreating any specific title.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
            {[
              "Save vs spend, level vs roll, roll-to-X",
              "Slam item vs hold, stabilize vs cap board",
              "Top-4 vs first, pivot vs commit",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-brand">›</span>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/solver" className="link mt-4 inline-block text-sm">
            Try a scenario →
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent">
              ▣
            </span>
            <h2 className="text-lg font-semibold text-white">LineLab TFT Study</h2>
            <span className="chip ml-auto">Coming soon</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            A Teamfight Tactics study companion — patch guides, comps, flashcards
            and post-game review. The shell is built; the TFT content layer ships
            only after Riot developer registration and clearance.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
            {[
              "Static patch & comp guides, flashcards",
              "Self player post-game reports (after API access)",
              "No live overlay, scouting, or in-game prescriptions",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-accent">›</span>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/study" className="link mt-4 inline-block text-sm">
            See the plan →
          </Link>
        </div>
      </section>

      {/* How the solver works */}
      <section className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          How the Solver works
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Describe the spot",
              d: "Set stage, HP, gold, level, board strength, bench, pairs, items, lobby tempo and your goal.",
            },
            {
              n: "02",
              t: "Simulate the lines",
              d: "A Python Monte Carlo engine plays out thousands of abstract 8-player lobbies for each candidate line.",
            },
            {
              n: "03",
              t: "Compare by EV",
              d: "Get expected placement, top-4 / first rates, a risk number, a decision tree, and a plain-English why.",
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
            Built for a clean compliance path
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            The Solver contains no Riot Games / Teamfight Tactics names, assets,
            data, combat formulas, or live-client access — it is a self-contained
            original game model. The TFT Study product is kept strictly separate
            and will use only approved assets and APIs after clearance. We never
            build live overlays, opponent scouting, client automation, or
            in-game &ldquo;do this now&rdquo; assistants.
          </p>
          <Link href="/compliance" className="link mt-3 inline-block text-sm">
            Read the compliance overview →
          </Link>
        </div>
      </section>
    </div>
  );
}
