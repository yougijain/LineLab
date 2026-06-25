// Original, fictional game content — mirror of backend units.py / traits.py /
// items.py. Wholly invented; no third-party game IP.

import { POOL_COPIES_PER_UNIT } from "./config";

export type Role = "carry" | "frontline" | "flex";
export type ItemClass = "offensive" | "defensive" | "utility";

export interface UnitDef {
  key: string;
  name: string;
  tier: number; // 1..5
  traits: string[];
  role: Role;
}

export const ROSTER: UnitDef[] = [
  // Tier I
  { key: "emberkit", name: "Emberkit", tier: 1, traits: ["pyre", "skirmisher"], role: "flex" },
  { key: "dustmote", name: "Dustmote", tier: 1, traits: ["drift", "skirmisher"], role: "frontline" },
  { key: "tallow", name: "Tallow", tier: 1, traits: ["forge", "warden"], role: "frontline" },
  { key: "sparrowtail", name: "Sparrowtail", tier: 1, traits: ["drift", "marksman"], role: "carry" },
  { key: "cinderpup", name: "Cinderpup", tier: 1, traits: ["pyre", "warden"], role: "frontline" },
  { key: "glimmerfin", name: "Glimmerfin", tier: 1, traits: ["tide", "mystic"], role: "carry" },
  // Tier II
  { key: "brackwarden", name: "Brackwarden", tier: 2, traits: ["tide", "warden"], role: "frontline" },
  { key: "quillark", name: "Quillark", tier: 2, traits: ["drift", "marksman"], role: "carry" },
  { key: "slagborn", name: "Slagborn", tier: 2, traits: ["forge", "skirmisher"], role: "flex" },
  { key: "voltaire", name: "Voltaire", tier: 2, traits: ["storm", "mystic"], role: "carry" },
  { key: "ashglen", name: "Ashglen", tier: 2, traits: ["pyre", "marksman"], role: "carry" },
  // Tier III
  { key: "thornveil", name: "Thornveil", tier: 3, traits: ["drift", "mystic"], role: "flex" },
  { key: "ironhowl", name: "Ironhowl", tier: 3, traits: ["forge", "warden"], role: "frontline" },
  { key: "mistral", name: "Mistral", tier: 3, traits: ["storm", "skirmisher"], role: "carry" },
  { key: "saltcrown", name: "Saltcrown", tier: 3, traits: ["tide", "warden"], role: "frontline" },
  { key: "pyrelady", name: "Pyrelady", tier: 3, traits: ["pyre", "mystic"], role: "carry" },
  // Tier IV
  { key: "graveltongue", name: "Graveltongue", tier: 4, traits: ["forge", "marksman"], role: "carry" },
  { key: "nimbusqueen", name: "Nimbusqueen", tier: 4, traits: ["storm", "mystic"], role: "carry" },
  { key: "deeproot", name: "Deeproot", tier: 4, traits: ["tide", "warden"], role: "frontline" },
  { key: "scorchwing", name: "Scorchwing", tier: 4, traits: ["pyre", "skirmisher"], role: "carry" },
  // Tier V
  { key: "the_kindler", name: "The Kindler", tier: 5, traits: ["pyre", "mystic"], role: "carry" },
  { key: "tempest_prime", name: "Tempest Prime", tier: 5, traits: ["storm", "warden"], role: "flex" },
  { key: "leviath", name: "Leviath", tier: 5, traits: ["tide", "skirmisher"], role: "frontline" },
];

export const ROSTER_BY_KEY: Record<string, UnitDef> = Object.fromEntries(
  ROSTER.map((u) => [u.key, u]),
);

export function unitsOfTier(tier: number): UnitDef[] {
  return ROSTER.filter((u) => u.tier === tier);
}

export function poolCopies(unit: UnitDef): number {
  return POOL_COPIES_PER_UNIT[unit.tier];
}

export interface TraitDef {
  key: string;
  name: string;
  kind: "origin" | "role";
  breakpoints: Record<number, number>; // count -> strength bonus
}

export const TRAITS: TraitDef[] = [
  { key: "pyre", name: "Pyre", kind: "origin", breakpoints: { 2: 4, 4: 11, 6: 22 } },
  { key: "tide", name: "Tide", kind: "origin", breakpoints: { 2: 4, 4: 10, 6: 20 } },
  { key: "storm", name: "Storm", kind: "origin", breakpoints: { 2: 5, 3: 10, 4: 18 } },
  { key: "drift", name: "Drift", kind: "origin", breakpoints: { 3: 6, 5: 15 } },
  { key: "forge", name: "Forge", kind: "origin", breakpoints: { 2: 4, 4: 12, 6: 21 } },
  { key: "marksman", name: "Marksman", kind: "role", breakpoints: { 2: 5, 4: 13 } },
  { key: "warden", name: "Warden", kind: "role", breakpoints: { 2: 5, 4: 12, 6: 20 } },
  { key: "mystic", name: "Mystic", kind: "role", breakpoints: { 2: 4, 4: 11 } },
  { key: "skirmisher", name: "Skirmisher", kind: "role", breakpoints: { 2: 4, 4: 10, 6: 18 } },
];

export const TRAITS_BY_KEY: Record<string, TraitDef> = Object.fromEntries(
  TRAITS.map((t) => [t.key, t]),
);

/** Strength bonus from fielding `count` units of a trait (highest met breakpoint). */
export function traitBonus(traitKey: string, count: number): number {
  const t = TRAITS_BY_KEY[traitKey];
  if (!t) return 0;
  let best = 0;
  for (const [bp, bonus] of Object.entries(t.breakpoints)) {
    if (count >= Number(bp)) best = Math.max(best, bonus);
  }
  return best;
}

/** Active breakpoint (the highest threshold met), 0 if none. */
export function activeBreakpoint(traitKey: string, count: number): number {
  const t = TRAITS_BY_KEY[traitKey];
  if (!t) return 0;
  let active = 0;
  for (const bp of Object.keys(t.breakpoints)) {
    if (count >= Number(bp)) active = Math.max(active, Number(bp));
  }
  return active;
}

export interface ModuleDef {
  key: string;
  name: string;
  itemClass: ItemClass;
  strength: number;
}

export const COMPONENTS = ["edge", "spark", "core", "plating", "ward", "vital", "lens", "sigil"];

export const MODULES: ModuleDef[] = [
  { key: "razorline", name: "Razorline", itemClass: "offensive", strength: 9.0 },
  { key: "starcaller", name: "Starcaller", itemClass: "offensive", strength: 9.5 },
  { key: "hailstorm", name: "Hailstorm", itemClass: "offensive", strength: 8.5 },
  { key: "aegishide", name: "Aegishide", itemClass: "defensive", strength: 7.5 },
  { key: "bulwark", name: "Bulwark", itemClass: "defensive", strength: 7.0 },
  { key: "lifewell", name: "Lifewell", itemClass: "defensive", strength: 7.0 },
  { key: "farsight", name: "Farsight", itemClass: "utility", strength: 6.0 },
  { key: "emblem_sigil", name: "Emblem Sigil", itemClass: "utility", strength: 5.0 },
];

export const MODULES_BY_KEY: Record<string, ModuleDef> = Object.fromEntries(
  MODULES.map((m) => [m.key, m]),
);

// Tier ring colors (I..V) that read on the dark theme — provisional; the visual
// design pass may refine these.
export const TIER_COLORS: Record<number, string> = {
  1: "#9ca3af", // slate
  2: "#34d399", // emerald
  3: "#60a5fa", // blue
  4: "#c084fc", // purple
  5: "#fbbf24", // amber/gold
};

// ---------------------------------------------------------------------------
// Plain-English "what this wants" coaching blurbs (original copy). These power
// the unit / trait / item inspectors so a learner always knows the intent.

export const UNIT_WANTS: Record<string, string> = {
  emberkit: "Cheap Pyre opener. Wants early levels, not items — sell it into 2-stars later.",
  dustmote: "Drift frontline filler. Holds the line early; items are wasted here.",
  tallow: "Forge/Warden wall. Front-left so it eats the first hits — give it a defensive module.",
  sparrowtail: "Backline Marksman carry. Wants 2–3 offensive modules and a back corner.",
  cinderpup: "Pyre/Warden frontline. Activates Pyre cheaply; sell once your real front shows up.",
  glimmerfin: "Tide Mystic carry that scales with stars. Wants a Lifewell and a protected flank.",
  brackwarden: "Tide/Warden anchor. Strong mid-game frontline — defensive items, front-center.",
  quillark: "Drift Marksman carry. A 2-star Quillark holds you for stages — offensive items.",
  slagborn: "Forge/Skirmisher flex. Use it to bridge to a higher breakpoint, then upgrade out.",
  voltaire: "Storm Mystic carry. Wants ability/utility modules and a safe back position.",
  ashglen: "Pyre Marksman carry. Pairs Pyre damage with carry items — back corner.",
  thornveil: "Drift Mystic flex. Splash for Drift/Mystic counts; rarely your main item-holder.",
  ironhowl: "Forge/Warden tank. Big frontline body — stack defensive items, front line.",
  mistral: "Storm Skirmisher carry. Dive carry — wants sustain + offense; mid position.",
  saltcrown: "Tide/Warden frontline. Pairs with Tide casters; defensive items, front-center.",
  pyrelady: "Pyre Mystic carry. Your Pyre payoff — full offensive item set, protected backline.",
  graveltongue: "4-cost Forge Marksman carry. Premier item-holder — give it your best modules.",
  nimbusqueen: "4-cost Storm Mystic carry. Wants ability power and a safe corner; can solo-carry.",
  deeproot: "4-cost Tide Warden super-tank. Front-center with full defensive items.",
  scorchwing: "4-cost Pyre Skirmisher carry. Aggressive dive — mix offense and a little sustain.",
  the_kindler: "5-cost Pyre Mystic legendary. Build around it — best items, protected backline.",
  tempest_prime: "5-cost Storm flex bomb. Strong on arrival; items optional but welcome.",
  leviath: "5-cost Tide Skirmisher frontline legendary. Anchors the front — defensive items.",
};

export const TRAIT_WANTS: Record<string, string> = {
  pyre: "Aggressive damage origin. Big jump at 4 — hold Pyre pairs toward it.",
  tide: "Scaling origin; rewards Mystics. Worth pushing to 4 with a Warden front.",
  storm: "Burst origin that spikes at 3–4. Cheap to activate, strong vertical payoff.",
  drift: "Late-blooming origin — only worth it at 3+. Don't splash just 1.",
  forge: "Tanky origin. 4 Forge makes your frontline very hard to kill.",
  marksman: "Carry role. 2 is fine early; 4 turns a carry into a wincon.",
  warden: "Frontline role. 4 Wardens let squishy carries survive the back line.",
  mystic: "Caster role — pairs with Tide/Storm/Pyre. Strong utility at 4.",
  skirmisher: "Dive role. Stack it to make your aggressors sticky in the enemy backline.",
};

export const ITEM_BEST_ON: Record<string, string> = {
  razorline: "Marksman / carry units (Sparrowtail, Quillark, Graveltongue).",
  starcaller: "Mystic carries (Pyrelady, Nimbusqueen, The Kindler).",
  hailstorm: "Any offensive carry that auto-attacks fast.",
  aegishide: "Front-line Wardens (Tallow, Saltcrown, Deeproot).",
  bulwark: "Tanks that need to survive magic damage.",
  lifewell: "Carries that take focus fire — keeps them alive to scale.",
  farsight: "Backline carries that want precision and reach.",
  emblem_sigil: "Flex units you want to splash into an extra trait.",
};

export function unitWants(key: string): string {
  return UNIT_WANTS[key] ?? "Flex unit — field it for its trait count.";
}
export function traitWants(key: string): string {
  return TRAIT_WANTS[key] ?? "";
}
export function itemBestOn(key: string): string {
  return ITEM_BEST_ON[key] ?? "Any flex unit.";
}
