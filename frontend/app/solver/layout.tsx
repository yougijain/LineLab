import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solver",
  description:
    "Describe any spot and get one recommended move — ROLL, LEVEL, SAVE, or STABILIZE — with a plain-English why, backed by a Monte Carlo expected-value engine.",
  alternates: { canonical: "/solver" },
};

export default function SolverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
