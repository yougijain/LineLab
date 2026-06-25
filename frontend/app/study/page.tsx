import Link from "next/link";

export const metadata = {
  title: "LineLab TFT Study — preview",
};

function CompCard({ name, tier }: { name: string; tier: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">{name}</div>
        <span className="chip">{tier}</span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-ink-700" />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip">Trait Group A</span>
        <span className="chip">Carry Unit A</span>
        <span className="chip">Item Module A</span>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Placeholder — real comp content ships after Riot clearance.
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-accent/40 text-accent">Coming soon</span>
        <span className="chip">Shell built · content gated on clearance</span>
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        LineLab TFT Study
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
        A Teamfight Tactics study companion in the spirit of Mobalytics and
        TFTAcademy — static patch guides, comp identities, flashcards, and
        post-game review. The infrastructure below is real; the TFT content,
        assets (Data Dragon), and Riot API features are added only after
        developer registration and clearance. Everything shown here uses neutral
        placeholders.
      </p>

      {/* Comp templates */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Comp cards
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <CompCard name="Comp A" tier="S" />
          <CompCard name="Comp B" tier="A" />
          <CompCard name="Comp C" tier="A" />
        </div>
      </section>

      {/* Flashcards + patch */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white">Flashcards</h2>
          <p className="mt-1 text-xs text-slate-400">
            Unit / item / trait / augment drills.
          </p>
          <div className="mt-4 grid gap-2">
            {["What does Trait Group A want?", "Best-in-slot for Carry Unit A?",
              "When do you pivot off Comp B?"].map((q) => (
              <div key={q} className="rounded-lg border border-ink-700 bg-ink-950/40 p-3 text-sm text-slate-200">
                {q}
                <span className="ml-2 text-xs text-slate-500">tap to flip</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white">Patch notes, explained</h2>
          <p className="mt-1 text-xs text-slate-400">Beginner-friendly change logs.</p>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm font-medium text-white">Patch 1.0 Notes</div>
              <ul className="mt-1 space-y-1 text-sm text-slate-300">
                <li className="flex gap-2"><span className="text-brand">▲</span> Carry Unit A buffed — Comp A rises a tier.</li>
                <li className="flex gap-2"><span className="text-red-400">▼</span> Item Module A nerfed — fewer flex builds.</li>
                <li className="flex gap-2"><span className="text-slate-500">＝</span> Trait Group A breakpoints unchanged.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Post-game review preview */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Post-game review (after API access)
        </h2>
        <div className="card mt-3 p-5">
          <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
{`Your last 20 games
  Average placement   4.8
  Top-4 rate          40%
  Main leak           weak midgame stabilization
  Study next          roll / level fundamentals
  Solver practice     midgame spend-vs-save spots`}
          </pre>
          <p className="mt-3 text-xs text-slate-500">
            Self player match-history reports only. No opponent scouting, no live
            data, no in-game prescriptions.
          </p>
        </div>
      </section>

      <div className="mt-10">
        <Link href="/compliance" className="link text-sm">
          How this stays compliant →
        </Link>
      </div>
    </div>
  );
}
