import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fundamentals",
  description:
    "Fourteen ranked TFT fundamentals in five modules — each a single actionable rule plus the common mistake it fixes. Start with the must-know six.",
  alternates: { canonical: "/learn" },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
