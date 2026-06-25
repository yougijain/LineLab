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
        LineLab is an independent educational tool that teaches Teamfight Tactics
        fundamentals. This page summarizes how it is designed to respect Riot
        Games&rsquo; intellectual property and developer policies.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-white">What LineLab is</h2>
          <p className="mt-2 text-sm text-slate-400">
            A fundamentals trainer built on an original simulation model, using
            TFT&rsquo;s own vocabulary to teach durable, patch-agnostic concepts.
          </p>
          <ul className="mt-4 space-y-2">
            <Row ok>Teaches transferable fundamentals — economy, leveling, rolling, positioning</Row>
            <Row ok>Original Monte Carlo model powers the Arena and Solver</Row>
            <Row ok>Refers to TFT and its mechanics nominally, for teaching</Row>
            <Row ok={false}>No Riot artwork, icons, champion portraits, or other assets</Row>
            <Row ok={false}>No champion / item / trait stats, or patch data tables</Row>
            <Row ok={false}>No live-client access, overlay, or automation</Row>
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-white">What LineLab never does</h2>
          <p className="mt-2 text-sm text-slate-400">
            We stay on the educational, pre-game side of the line publishers draw.
          </p>
          <ul className="mt-4 space-y-2">
            <Row ok={false}>No live overlay that reads or reacts to your real game</Row>
            <Row ok={false}>No scouting of real opponents&rsquo; boards</Row>
            <Row ok={false}>No &ldquo;do this now&rdquo; prescriptions inside the real client</Row>
            <Row ok={false}>No memory reading, packet sniffing, or automation</Row>
            <Row ok={false}>No reproduction of Riot&rsquo;s art, data, or branding</Row>
            <Row ok>Everything runs on synthetic data and your inputs only</Row>
          </ul>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          The line we draw
        </h2>
        <div className="card mt-3 p-5 text-sm leading-relaxed text-slate-300">
          <p>
            Riot&rsquo;s policies — like most publishers&rsquo; — encourage tools
            that help players improve over time through pre-game learning and
            analysis of their own data, while disallowing real-time in-client
            information, opponent scouting, and apps that play the game for you.
            LineLab is built squarely on the safe side of that line:
          </p>
          <ul className="mt-3 space-y-1.5">
            <li className="flex gap-2"><span className="text-brand">›</span> It teaches concepts and runs an original simulation — it is not a TFT clone and ships no Riot assets or data.</li>
            <li className="flex gap-2"><span className="text-brand">›</span> It never connects to the live game, reads your screen, or reacts to a real match in progress.</li>
            <li className="flex gap-2"><span className="text-brand">›</span> The practice Arena is a self-contained game; the &ldquo;opponents&rdquo; are simulated, not real players.</li>
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          If we ever add personalized data
        </h2>
        <div className="card mt-3 p-5 text-sm leading-relaxed text-slate-300">
          <p>
            Features like your own post-game match history would use Riot&rsquo;s
            official developer APIs and approved assets (Data Dragon) only after
            registering a product on the Riot Developer Portal and following
            Riot&rsquo;s Legal Jibber Jabber. Until then, LineLab stays
            patch-agnostic and asset-free — nothing here depends on Riot&rsquo;s
            data or approval to run.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          What we never build
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Live game overlay", "Real-board reader", "TFT clone simulator",
            "Real-opponent scouting", "Client automation", "Memory reading",
            "In-game “buy/roll/level now” assistant",
          ].map((t) => (
            <span key={t} className="chip border-red-500/30 text-red-300">
              {t}
            </span>
          ))}
        </div>
      </section>

      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-slate-500">
        This overview is a plain-English summary of design intent, not legal
        advice. LineLab is not affiliated with, endorsed by, sponsored by, or
        specifically approved by Riot Games. Teamfight Tactics and TFT are
        trademarks of Riot Games, Inc., referenced here nominatively for
        identification and educational purposes only.
      </p>
    </div>
  );
}
