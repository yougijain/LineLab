import Link from "next/link";

const links = [
  { href: "/solver", label: "Solver" },
  { href: "/play", label: "Arena" },
  { href: "/study", label: "TFT Study" },
  { href: "/compliance", label: "Compliance" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand font-mono text-sm font-bold text-ink-950">
            L
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            Line<span className="text-brand">Lab</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-slate-300 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/solver" className="btn-primary ml-2">
            Open Solver
          </Link>
        </nav>
      </div>
    </header>
  );
}
