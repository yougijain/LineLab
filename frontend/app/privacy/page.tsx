export const metadata = { title: "LineLab — Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="text-2xl font-semibold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated: template draft.</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="font-semibold text-white">1. Overview</h2>
          <p className="mt-1">
            This policy explains what LineLab collects and why. The Solver itself
            requires no account and sends only the scenario inputs you choose to
            the simulation backend.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">2. What we collect</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Scenario inputs you submit to the Solver (to compute results).</li>
            <li>Scenarios you explicitly save.</li>
            <li>Basic, privacy-respecting usage analytics (aggregate only).</li>
            <li>
              If you later link a game account for post-game review: your own
              match history and statistics, used solely to generate your reports.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-white">3. What we do not do</h2>
          <p className="mt-1">
            We do not collect data about other players, read any live game client,
            or sell personal data. Post-game features only ever use your own
            account data, with your consent.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">4. Data retention &amp; deletion</h2>
          <p className="mt-1">
            You may request deletion of your saved scenarios and any linked-account
            data at any time. Linked game-account data is deleted on account
            unlink or upon request.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">5. Third parties</h2>
          <p className="mt-1">
            Hosting and analytics may process data to provide the Service. If
            personalized features are ever added, Riot Games&rsquo; official
            developer API would process only your own data, after registration on
            the Riot Developer Portal. We use only the access necessary for each
            feature.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-white">6. Contact</h2>
          <p className="mt-1">
            Questions about privacy can be directed to the site owner. This is a
            template and should be reviewed by counsel before production launch.
          </p>
        </section>
      </div>
    </div>
  );
}
