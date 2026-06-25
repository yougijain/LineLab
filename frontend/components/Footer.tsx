import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-700">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-slate-400">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="text-base font-semibold text-white">
              Line<span className="text-brand">Lab</span>
            </div>
            <p className="mt-2 leading-relaxed">
              An independent tool for learning Teamfight Tactics fundamentals. It
              uses no Riot Games assets, data, or live-client access, and is not
              affiliated with or endorsed by Riot Games.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            <Link href="/learn" className="hover:text-white">Learn</Link>
            <Link href="/play" className="hover:text-white">Arena</Link>
            <Link href="/solver" className="hover:text-white">Solver</Link>
            <Link href="/compliance" className="hover:text-white">Compliance</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
        <div className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} LineLab. Uses no Riot Games assets, data,
          or live-client access. Teamfight Tactics and TFT are trademarks of Riot
          Games, Inc.
        </div>
      </div>
    </footer>
  );
}
