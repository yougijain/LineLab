export const metadata = { title: "LineLab — Terms of Service" };

export default function TermsPage() {
  return (
    <div className="prose-invert mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-semibold text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: template draft.</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="font-semibold text-white">1. Acceptance</h2>
          <p className="mt-1">
            By using LineLab (the &ldquo;Service&rdquo;) you agree to these Terms.
            If you do not agree, do not use the Service.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">2. What LineLab is</h2>
          <p className="mt-1">
            LineLab provides an original auto-battler decision-theory solver and
            educational study material. The Solver operates on a fictional game
            model and is for learning and analysis only. Outputs are estimates
            from a Monte Carlo simulation and are not guarantees of any in-game
            result.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">3. No affiliation</h2>
          <p className="mt-1">
            LineLab is independent and is not affiliated with, endorsed by, or
            sponsored by any game publisher. Any third-party trademarks referenced
            for descriptive purposes remain the property of their owners.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">4. Acceptable use</h2>
          <p className="mt-1">
            You agree not to use the Service to automate gameplay, read a live
            game client, scout opponents, or otherwise violate any game&rsquo;s
            terms of service. The Service does not provide real-time in-game
            assistance.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">5. Accounts &amp; data</h2>
          <p className="mt-1">
            Saved scenarios and study progress may be stored to provide the
            Service. See the <a className="link" href="/privacy">Privacy Policy</a>.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">6. Disclaimer &amp; liability</h2>
          <p className="mt-1">
            The Service is provided &ldquo;as is&rdquo; without warranties. To the
            maximum extent permitted by law, LineLab is not liable for any
            indirect or consequential damages arising from use of the Service.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">7. Changes</h2>
          <p className="mt-1">
            We may update these Terms; continued use after changes constitutes
            acceptance. This is a template and should be reviewed by counsel before
            production launch.
          </p>
        </section>
      </div>
    </div>
  );
}
