import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const ROUTES = [
  { path: "/", priority: 1 },
  { path: "/learn", priority: 0.9 },
  { path: "/play", priority: 0.9 },
  { path: "/solver", priority: 0.8 },
  { path: "/compliance", priority: 0.4 },
  { path: "/terms", priority: 0.2 },
  { path: "/privacy", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
  }));
}
