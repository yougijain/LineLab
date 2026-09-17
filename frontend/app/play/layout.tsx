import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Arena",
  description:
    "A playable auto-battler with a live coach that calls one move at a time — roll, level, save, or stabilize — plus a post-game review that grades every macro decision.",
  alternates: { canonical: "/play" },
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
