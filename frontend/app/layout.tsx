import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "LineLab — Learn Teamfight Tactics fundamentals",
  description:
    "Learn the handful of durable TFT decisions that get you to top 4 — economy, leveling, rolling, items, positioning — then drill them against a live coach. Independent; uses no Riot assets or data.",
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
