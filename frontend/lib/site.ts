/** Canonical site origin, used for metadata (Open Graph, canonical URLs). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "LineLab";

export const SITE_TAGLINE =
  "Learn the handful of Teamfight Tactics decisions that get you to top 4.";

export const SITE_DESCRIPTION =
  "LineLab teaches the durable, patch-agnostic TFT fundamentals — economy, " +
  "leveling, rolling, items, positioning — then lets you drill them in a playable " +
  "Arena against a live coach. Independent; uses no Riot Games assets or data.";
