// The fundamentals curriculum — the handful of durable, patch-agnostic TFT
// decisions that take a new player from "bleeding out" to "reliably top 4".
// Ranked and grouped from a multi-source research pass over beginner coaching.
// Original copy; uses TFT's universal vocabulary, no champion/patch data.

export interface Fundamental {
  id: string;
  rank: number; // overall leverage order, 1 = highest
  moduleId: string;
  icon: string; // single glyph for the card
  title: string; // the concept, said plainly
  rule: string; // the one thing to actually do
  why: string; // why it matters, one sentence
  mistake: string; // the beginner mistake it fixes
  core: boolean; // shown on first contact (the "must-know 6")
}

export interface LearnModule {
  id: string;
  title: string;
  goal: string;
}

export const MODULES: LearnModule[] = [
  {
    id: "survive",
    title: "Survive & win",
    goal: "Know the real win condition and treat your health like a resource.",
  },
  {
    id: "board",
    title: "Build a board that wins fights",
    goal: "Field a full, well-positioned, well-itemized board every round.",
  },
  {
    id: "economy",
    title: "The money engine",
    goal: "Turn gold into compounding power instead of spending it on impulse.",
  },
  {
    id: "scale",
    title: "Get bigger & roll without going broke",
    goal: "Level on a schedule and roll in disciplined bursts.",
  },
  {
    id: "lobby",
    title: "Read the lobby",
    goal: "Scout the other seven players and let it shape your plan.",
  },
];

export const FUNDAMENTALS: Fundamental[] = [
  // --- Survive & win ---
  {
    id: "hp-budget",
    rank: 1,
    moduleId: "survive",
    icon: "❤",
    title: "Health is a budget — you're playing for top 4",
    rule: "Spend HP like a second wallet: bleeding to 50–60 to grow your economy is fine, but never coast under ~30 without a plan to stabilize. Take the safe top-4 line over the greedy gamble for 1st unless you're clearly the strongest board.",
    why: "Your placement is what climbs, not your health bar. A steady 3rd–4th beats alternating 1st and 8th, and unspent HP is wasted value.",
    mistake: "Panic-spending gold to protect HP you didn't need — or hoarding so hard you bleed out before your board comes online.",
    core: true,
  },
  {
    id: "blowout-losses",
    rank: 8,
    moduleId: "survive",
    icon: "💥",
    title: "Losing badly hurts far more than losing close",
    rule: "Damage taken ≈ the stage's base hit + how many enemy units are still alive. A 7-vs-6 near miss is cheap; getting wiped with 8 enemies standing can cost 20+. When weak, a close loss is fine — a blowout is the danger.",
    why: "This is the mechanic behind 'HP is a resource.' You can only choose when it's safe to lose once you know which losses are cheap.",
    mistake: "Treating every loss as equal — ignoring the blowouts that are actually knocking you out.",
    core: false,
  },

  // --- Build a board that wins fights ---
  {
    id: "field-max",
    rank: 2,
    moduleId: "board",
    icon: "▦",
    title: "Always field your max units, and prefer 2-stars",
    rule: "Fill the board to your level cap every round (level 6 = 6 units). Three copies combine into a 2-star (~1.8× stronger), so favor one 2-star over two extra 1-stars.",
    why: "Fighting understrength is the single most common avoidable loss. Every extra body adds free damage and survivability.",
    mistake: "Leaving empty board slots, or selling a pair to buy a shiny new unit instead of finishing the 2-star.",
    core: true,
  },
  {
    id: "protect-carry",
    rank: 3,
    moduleId: "board",
    icon: "🛡",
    title: "Frontline tanks, backline carry — protect your damage",
    rule: "Tanky units on the front rows to soak hits; squishy ranged units and your main carry in the back row, tucked in a corner so enemies reach them last.",
    why: "Fights are won by keeping your damage-dealer alive longest. A carry on the front line dies in seconds and loses a fight you should win.",
    mistake: "Scattering units randomly, or parking a fragile carry up front where it gets deleted instantly.",
    core: true,
  },
  {
    id: "slam-items",
    rank: 4,
    moduleId: "board",
    icon: "⚒",
    title: "Slam items — attack damage on attackers, ability power on casters",
    rule: "Combine components into finished items now instead of hoarding for the 'perfect' one. Put attack-damage items on an auto-attacker, ability-power items on a caster, and stack all three on one main carry before itemizing anyone else.",
    why: "A finished item fights dozens of rounds and saves HP; a loose component does nothing. Most of your damage comes from one fully-itemized carry.",
    mistake: "Sitting on components for ten-plus rounds, spreading items so nobody hits hard, or putting damage items on a tank.",
    core: true,
  },
  {
    id: "breakpoints",
    rank: 6,
    moduleId: "board",
    icon: "◈",
    title: "Hit trait breakpoints exactly",
    rule: "Traits only pay out at thresholds (usually 2 / 4 / 6). Land exactly on a breakpoint — a 3rd unit of a 2/4 trait is wasted. One unit more or fewer can flip your whole board's power.",
    why: "The power jump happens only when you cross a breakpoint, so a live breakpoint is worth far more than the same units stuck one short.",
    mistake: "Fielding 3 of a trait thinking it's 'almost' the 4, or chasing many traits at one unit each.",
    core: false,
  },
  {
    id: "bench-hygiene",
    rank: 11,
    moduleId: "board",
    icon: "🧹",
    title: "Keep the bench clear — sell what you abandoned",
    rule: "A unit on your bench does nothing. Keep space free so you can buy and finish pairs, and sell off units from lines you've given up on to fund the comp you're actually building.",
    why: "A clogged bench means missed buys and missed 2-stars; dead units sitting there are frozen gold.",
    mistake: "Hoarding a full bench of random 1-stars and missing a buy — or never selling abandoned units and staying poor.",
    core: false,
  },

  // --- The money engine ---
  {
    id: "interest-50",
    rank: 5,
    moduleId: "economy",
    icon: "🪙",
    title: "Interest: bank in tens, live at 50",
    rule: "Every 10 gold you hold earns +1 free gold next round, capped at +5 once you reach 50. End early rounds on a clean 10 / 20 / 30 / 40 / 50 — never an ugly 7 or 13. Race to 50 safely, then spend only the overflow above it.",
    why: "Interest is free compounding income, and 50 is where it maxes. Banking 50 hands you 5 extra gold every round that snowballs into levels and units.",
    mistake: "Spending down to 7 or 13 and wasting interest — or hoarding 70+ gold that earns nothing and never gets used.",
    core: true,
  },
  {
    id: "save-default",
    rank: 7,
    moduleId: "economy",
    icon: "🏦",
    title: "Save by default; spend only with a reason",
    rule: "Your default action is to NOT roll. Spend a burst of gold only when it has a job — hitting a level breakpoint with healthy gold, or stabilizing at low HP. When unsure, save and level.",
    why: "Random early rolling burns the gold that becomes interest and levels, leaving you small and poor. Discipline converts straight into a stronger board later.",
    mistake: "Itchy-finger rolling 'just to see what's there' every round, ending each turn near 0 with no interest and no plan.",
    core: false,
  },

  // --- Get bigger & roll ---
  {
    id: "level-schedule",
    rank: 9,
    moduleId: "scale",
    icon: "⬆",
    title: "Each level is a unit + better odds — level on a schedule",
    rule: "Your level equals how many units you field, and higher levels raise the odds of pricier units. Level on autopilot as a beginner: 4 by 2-1, 5 by 2-5, 6 by 3-2, 7 by 4-1, 8 around 4-2 to 5-1. Level 8 is where you roll for your 4-cost carries.",
    why: "More bodies almost always wins at equal upgrades, and a fixed cadence removes the hardest decisions so you can focus on board and items.",
    mistake: "Never buying XP and assuming level just happens — or forcing level 9 at low HP while never comfortably hitting a healthy 8.",
    core: false,
  },
  {
    id: "roll-burst",
    rank: 10,
    moduleId: "scale",
    icon: "🎲",
    title: "Rolling buys odds — roll down in one burst with a stop rule",
    rule: "Each reroll shuffles 5 new shop slots for a chance, not a guarantee. 'Rolling down' means spending a focused 30–50 in one moment at your level, not dribbling 2 every turn. Before you start, set a floor: stop when you hit your key upgrades, or at 10 gold left.",
    why: "You pay for odds, not outcomes. Focused bursts at the right level actually hit; random dribbling finds nothing and starves your economy.",
    mistake: "Expecting your unit after one or two rolls and panicking, or tilt-rolling to 0 chasing one champion.",
    core: false,
  },

  // --- Read the lobby ---
  {
    id: "scout",
    rank: 12,
    moduleId: "lobby",
    icon: "🔭",
    title: "Scout the other 7 boards before you commit gold",
    rule: "Each round, glance at the lobby: who's fielding your units (you share that pool, so your copies are scarcer), and who you fight next (if their board is much stronger, expect damage and consider stabilizing).",
    why: "You don't play in a vacuum. Contested units mean you roll harder or pivot; a scary matchup tells you to spend now instead of greeding.",
    mistake: "Tunneling on your own board all game, then getting surprised by a blowout — or wondering why your key unit never shows up.",
    core: true,
  },
  {
    id: "streaks",
    rank: 13,
    moduleId: "lobby",
    icon: "📈",
    title: "Streaks pay — but never lose-streak into death",
    rule: "Winning or losing several rounds in a row pays escalating bonus gold. Pick one lane: win-streak while healthy, or lose-streak on purpose only while your HP can afford it. The moment a lose-streak threatens ~30 HP, stop and stabilize.",
    why: "Streak gold is real income, but going even by accident earns nothing — and lose-streaking at low HP is a classic way to die with a full wallet.",
    mistake: "Drifting in and out of streaks by accident, or stubbornly lose-streaking past safe HP and getting knocked out.",
    core: false,
  },
  {
    id: "augments",
    rank: 14,
    moduleId: "lobby",
    icon: "✦",
    title: "Augments: pick the one that fits your plan",
    rule: "A few times per game you choose 1 of 3 augments (economy, combat, or trait boosts). As a beginner, economy augments are the safe default because they help any board. Otherwise pick the one matching what you're already building — never a trait boost for a trait you don't have.",
    why: "Augments are a real power source and new players freeze on them. 'Economy is safe, otherwise match your plan' turns a scary choice into a quick, correct one.",
    mistake: "Picking the flashiest-sounding augment instead of one that fits the board you'll actually build.",
    core: false,
  },
];

export const CORE_FUNDAMENTALS = FUNDAMENTALS.filter((f) => f.core).sort((a, b) => a.rank - b.rank);

export function fundamentalsByModule(moduleId: string): Fundamental[] {
  return FUNDAMENTALS.filter((f) => f.moduleId === moduleId).sort((a, b) => a.rank - b.rank);
}
