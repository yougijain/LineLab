import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "LineLab — Auto-battler macro solver & TFT study",
  description:
    "LineLab Solver is an original Monte Carlo decision-theory engine for auto-battler macro decisions: save vs roll vs level, stabilize vs cap, top-4 vs first.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-5">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
