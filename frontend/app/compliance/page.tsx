export const metadata = { title: "LineLab — Compliance overview" };

function Row({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className={ok ? "text-brand" : "text-red-400"}>{ok ? "✓" : "✕"}</span>
      <span className="text-slate-300">{children}</span>
    </li>
  );
}

export default function CompliancePage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Compliance overview
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
        LineLab is an independent educational website with two clearly separated
        products. This page summarizes how each is designed to respect game
        publishers&rsquo; intellectual property and developer policies.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-white">LineLab Solver — what it is</h2>
          <p className="mt-2 text-sm text-slate-400">
            An original auto-battler decision-theory engine over a fictional game
            model.
          </p>
          <ul className="mt-4 space-y-2">
            <Row ok>Original, invented units, traits and stat modules</Row>
            <Row ok>Generic tiered shop odds and economy — no copied data tables</Row>
            <Row ok>Abstract board-strength combat, not a battle simulator</Row>
            <Row ok>Synthetic Monte Carlo data only</Row>
            <Row ok={false}>No Riot / TFT names, assets, icons or IP</Row>
            <Row ok={false}>No live-client access, overlay or automation</Row>
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-white">LineLab TFT Study — what it will be</h2>
          <p className="mt-2 text-sm text-slate-400">
            A static study companion plus self player post-game review, after
            developer registration and clearance.
          </p>
          <ul className="mt-4 space-y-2">
            <Row ok>Static patch guides, comps, flashcards (pre-game best practices)</Row>
            <Row ok>Approved assets (Data Dragon / press kit) only after clearance</Row>
            <Row ok>Self player match-history &amp; aggregate stats</Row>
            <Row ok={false}>No live overlay that adapts to in-game state</Row>
            <Row ok={false}>No opponent scouting or next-play prediction</Row>
            <Row ok={false}>No &ldquo;do this now&rdquo; in-game prescriptions</Row>
          </ul>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          The line we draw
        </h2>
        <div className="card mt-3 p-5 text-sm leading-relaxed text-slate-300">
          <p>
            Publisher policy generally encourages tools that help players improve
            over time — especially pre-game best practices and post-game analysis —
            while disallowing dynamic real-time information, opponent scouting, and
            apps that dictate in-game decisions. LineLab is built around that line:
          </p>
          <ul className="mt-3 space-y-1.5">
            <li className="flex gap-2"><span className="text-brand">›</span> The Solver teaches transferable concepts on an original model, so it never touches publisher IP.</li>
            <li className="flex gap-2"><span className="text-brand">›</span> The Study product stays static and pre-game, or strictly post-game on the player&rsquo;s own data.</li>
            <li className="flex gap-2"><span className="text-brand">›</span> The two products are separated in code, UI and data so review is unambiguous.</li>
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          What we never build
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Live TFT solver", "Live board reader", "TFT clone simulator",
            "Opponent scouting", "Client automation", "Memory reading",
            "In-game “buy/roll/level now” assistant",
          ].map((t) => (
            <span key={t} className="chip border-red-500/30 text-red-300">
              {t}
            </span>
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        This overview is a plain-English summary of design intent, not legal
        advice. LineLab is not affiliated with or endorsed by any game publisher.
      </p>
    </div>
  );
}
