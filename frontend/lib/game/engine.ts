// LineLab playable auto-chess engine. Pure, deterministic given a seed; all
// functions take a Game and return a NEW Game (cloned) so React state updates
// cleanly. Mirrors the backend solver's economy/shop/leveling/combat model.

import {
  BASE_INCOME,
  FINAL_STAGE,
  MAX_LEVEL,
  REFRESH_COST,
  ROUNDS_PER_STAGE,
  SHOP_SLOTS,
  STAGE_BASE_DAMAGE,
  TIER_COST,
  WIN_GOLD,
  XP_BUY_AMOUNT,
  XP_BUY_COST,
  XP_PASSIVE,
  XP_TO_NEXT,
  interest,
  stageBaselineStrength,
  streakBonus,
  tierOdds,
  winProbability,
} from "./config";
import { POOL_COPIES_PER_UNIT } from "./config";
import {
  ROSTER,
  ROSTER_BY_KEY,
  TRAITS_BY_KEY,
  activeBreakpoint,
  traitBonus,
  unitsOfTier,
} from "./data";
import { BOT_IDENTITIES, BOT_IDENTITY_BY_KEY, botDiff } from "./tiers";
import { fieldedTraitCounts, heroBoardStrength } from "./strength";
import { defaultConditions, offerThree, pickModifier, rollStageEvent, traitBoostBonus } from "./conditions";
import { toSolverState } from "./solverMap";
import type { Bot, FieldUnit, Game, Hero, Settings, Star } from "./types";

let UID = 0;
const newUid = () => `u${++UID}`;

/** A high-entropy, non-reproducible seed for a fresh run (crypto when available). */
export function randomSeed(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] & 0x7fffffff;
  }
  return Math.floor(Math.random() * 2 ** 31);
}
const COPIES_FOR_STAR: Record<number, number> = { 1: 1, 2: 3, 3: 9 };
const BOT_NAMES = ["Vex", "Koro", "Nyx", "Pyre", "Sable", "Drift", "Onyx", "Quill"];

// ---------------------------------------------------------------------------
// RNG (mulberry32 stepping on a serializable integer state)
// ---------------------------------------------------------------------------

function rand(g: Game): number {
  let t = (g.rngState = (g.rngState + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function gauss(g: Game, mean: number, sd: number): number {
  const u = Math.max(1e-9, rand(g));
  const v = rand(g);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clone = (g: Game): Game => structuredClone(g);

// ---------------------------------------------------------------------------
// Pool & shop
// ---------------------------------------------------------------------------

function freshPool(): Record<string, number> {
  const pool: Record<string, number> = {};
  for (const u of ROSTER) pool[u.key] = POOL_COPIES_PER_UNIT[u.tier];
  return pool;
}

function pickTier(g: Game, level: number): number {
  const odds = tierOdds(level);
  const r = rand(g);
  let cum = 0;
  for (let i = 0; i < odds.length; i++) {
    cum += odds[i];
    if (r <= cum) return i + 1;
  }
  return 1;
}

function pickUnitOfTier(g: Game, tier: number): string | null {
  const candidates = unitsOfTier(tier).filter((u) => (g.pool[u.key] ?? 0) > 0);
  if (!candidates.length) return null;
  const total = candidates.reduce((s, u) => s + g.pool[u.key], 0);
  let r = rand(g) * total;
  for (const u of candidates) {
    r -= g.pool[u.key];
    if (r <= 0) return u.key;
  }
  return candidates[candidates.length - 1].key;
}

function rollShop(g: Game): void {
  const slots: (string | null)[] = [];
  for (let i = 0; i < SHOP_SLOTS; i++) {
    slots.push(pickUnitOfTier(g, pickTier(g, g.hero.level)));
  }
  g.hero.shop = slots;
}

// ---------------------------------------------------------------------------
// New game
// ---------------------------------------------------------------------------

export function newGame(settings: Settings): Game {
  const startStage = 2;
  const diff = botDiff(settings.botDiff);
  const names = [...BOT_NAMES];

  const hero: Hero = {
    hp: 100, gold: 12, level: 3, xp: 0, streak: 0,
    board: [], bench: [], shop: [], itemBank: [], alive: true, placement: 0,
  };

  const g: Game = {
    rngState: settings.seed | 0,
    seed: settings.seed,
    stage: startStage,
    roundInStage: 0,
    roundNumber: 1,
    phase: "plan",
    hero,
    bots: [],
    pool: freshPool(),
    settings,
    decisions: [],
    log: [],
    lastRound: null,
    planPre: null,
    planStartLevel: hero.level,
    planRerolls: 0,
    conditions: defaultConditions(),
    pendingOffer: null,
    freeRollsLeft: 0,
  };

  const baseline = stageBaselineStrength(startStage);
  for (let i = 0; i < 7; i++) {
    const idx = Math.floor(rand(g) * names.length);
    const name = names.splice(idx, 1)[0] ?? `Bot${i}`;
    const identity = BOT_IDENTITIES[Math.floor(rand(g) * BOT_IDENTITIES.length)];
    const bot: Bot = {
      id: `b${i}`,
      name,
      hp: 100,
      strength: Math.max(5, baseline * diff.tempoFactor + gauss(g, 0, 8)),
      alive: true,
      placement: 0,
      streak: 0,
      board: {
        units: [], level: 2, traits: {}, itemCount: 0,
        identityKey: identity.key, identityLabel: identity.label, buildLine: identity.buildLine,
      },
    };
    syncBotBoard(g, bot);
    g.bots.push(bot);
  }

  rollShop(g);
  g.pendingOffer = offerThree(g); // first modifier pick at game start
  g.planPre = toSolverState(g);
  return g;
}

/** Rebuild a bot's visible board to reflect its identity + current stage power.
 *  This is a *rendering* of the bot's abstract strength for scouting, kept cheap
 *  (O(units) per bot per round). */
function syncBotBoard(g: Game, bot: Bot): void {
  const diff = botDiff(g.settings.botDiff);
  const id = BOT_IDENTITY_BY_KEY[bot.board.identityKey] ?? BOT_IDENTITIES[0];
  const level = Math.max(2, Math.min(9, 2 + Math.floor(g.stage * diff.levelPace)));
  const n = Math.max(1, Math.min(level, 1 + Math.round(g.stage * diff.boardSizePace)));
  const pool = ROSTER.filter((u) => u.traits.some((t) => id.traits.includes(t)));
  const used = new Set<string>();
  const units: FieldUnit[] = [];
  for (let i = 0; i < n; i++) {
    const tier = pickTier(g, level);
    let cands = pool.filter((u) => u.tier === tier && !used.has(u.key));
    if (!cands.length) cands = pool.filter((u) => !used.has(u.key));
    if (!cands.length) cands = ROSTER.filter((u) => !used.has(u.key));
    if (!cands.length) break;
    const def = cands[Math.floor(rand(g) * cands.length)];
    used.add(def.key);
    const star: Star = rand(g) < diff.starBias ? (rand(g) < diff.starBias * 0.4 ? 3 : 2) : 1;
    units.push({
      uid: newUid(), key: def.key, name: def.name, tier: def.tier, star,
      traits: def.traits, role: def.role, items: [], onBoard: true, cell: i,
    });
  }
  bot.board = {
    units, level,
    traits: fieldedTraitCounts(units),
    itemCount: Math.max(0, Math.round((g.stage - 1) * diff.itemPace)),
    identityKey: id.key, identityLabel: id.label, buildLine: id.buildLine,
  };
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

function makeUnit(key: string): FieldUnit {
  const def = ROSTER_BY_KEY[key];
  return {
    uid: newUid(), key, name: def.name, tier: def.tier, star: 1,
    traits: def.traits, role: def.role, items: [], onBoard: false, cell: null,
  };
}

export function fieldedCount(hero: Hero): number {
  return hero.board.length;
}

function removeUnits(g: Game, uids: Set<string>): void {
  g.hero.board = g.hero.board.filter((u) => !uids.has(u.uid));
  g.hero.bench = g.hero.bench.filter((u) => !uids.has(u.uid));
}

function combineCheck(g: Game, key: string): void {
  for (let star = 1; star < 3; star++) {
    while (true) {
      const all = [...g.hero.board, ...g.hero.bench].filter(
        (u) => u.key === key && u.star === star,
      );
      if (all.length < 3) break;
      const three = all.slice(0, 3);
      const items: string[] = [];
      for (const u of three) items.push(...u.items);
      const keepBoard = three.find((u) => u.onBoard);
      removeUnits(g, new Set(three.map((u) => u.uid)));
      const merged: FieldUnit = {
        uid: newUid(), key, name: three[0].name, tier: three[0].tier, star: (star + 1) as Star,
        traits: three[0].traits, role: three[0].role,
        items: items.slice(0, 3),
        onBoard: !!keepBoard, cell: keepBoard ? keepBoard.cell : null,
      };
      g.hero.itemBank.push(...items.slice(3));
      if (merged.onBoard) g.hero.board.push(merged);
      else g.hero.bench.push(merged);
    }
  }
}

// ---------------------------------------------------------------------------
// Player actions (each returns a new Game; no-op if illegal)
// ---------------------------------------------------------------------------

export function buyUnit(game: Game, slot: number): Game {
  const g = clone(game);
  const key = g.hero.shop[slot];
  if (!key || g.phase !== "plan") return game;
  const cost = TIER_COST[ROSTER_BY_KEY[key].tier];
  if (g.hero.gold < cost) return game;
  if (g.hero.bench.length >= 9) {
    // allow if it will immediately combine; else reject
    const copies = [...g.hero.board, ...g.hero.bench].filter(
      (u) => u.key === key && u.star === 1,
    ).length;
    if (copies < 2) return game;
  }
  if ((g.pool[key] ?? 0) <= 0) return game;
  g.hero.gold -= cost;
  g.pool[key] -= 1;
  g.hero.bench.push(makeUnit(key));
  g.hero.shop[slot] = null;
  combineCheck(g, key);
  return g;
}

export function refundValue(u: FieldUnit): number {
  return TIER_COST[u.tier] * COPIES_FOR_STAR[u.star] - (u.star > 1 ? 1 : 0);
}

export function sellUnit(game: Game, uid: string): Game {
  const g = clone(game);
  if (g.phase !== "plan") return game;
  const unit =
    g.hero.board.find((u) => u.uid === uid) ??
    g.hero.bench.find((u) => u.uid === uid);
  if (!unit) return game;
  g.hero.gold += refundValue(unit);
  g.pool[unit.key] = (g.pool[unit.key] ?? 0) + COPIES_FOR_STAR[unit.star];
  g.hero.itemBank.push(...unit.items);
  removeUnits(g, new Set([uid]));
  return g;
}

export function refreshShop(game: Game): Game {
  const g = clone(game);
  if (g.phase !== "plan") return game;
  const cost = g.conditions.refreshCost;
  if (g.freeRollsLeft > 0) {
    g.freeRollsLeft -= 1; // Free Scout — no charge
  } else {
    if (g.hero.gold < cost) return game;
    g.hero.gold -= cost;
  }
  g.planRerolls += 1;
  rollShop(g);
  return g;
}

function applyLevelUps(g: Game): boolean {
  let leveled = false;
  while (g.hero.level < MAX_LEVEL && g.hero.xp >= (XP_TO_NEXT[g.hero.level] ?? 1e9)) {
    g.hero.xp -= XP_TO_NEXT[g.hero.level];
    g.hero.level += 1;
    leveled = true;
  }
  if (g.hero.level >= MAX_LEVEL) g.hero.xp = 0;
  return leveled;
}

export function buyXP(game: Game): Game {
  const g = clone(game);
  const cost = g.conditions.xpCost;
  if (g.phase !== "plan" || g.hero.gold < cost || g.hero.level >= MAX_LEVEL) return game;
  g.hero.gold -= cost;
  g.hero.xp += XP_BUY_AMOUNT;
  if (applyLevelUps(g)) rollShop(g); // leveling refreshes the shop
  return g;
}

export function fieldUnit(game: Game, uid: string, cell: number): Game {
  const g = clone(game);
  if (g.phase !== "plan") return game;
  const occupied = g.hero.board.find((u) => u.cell === cell && u.uid !== uid);
  const unit =
    g.hero.bench.find((u) => u.uid === uid) ??
    g.hero.board.find((u) => u.uid === uid);
  if (!unit) return game;

  if (!unit.onBoard) {
    if (occupied) return game; // can't drop onto an occupied cell from bench
    if (fieldedCount(g.hero) >= g.hero.level) return game; // board full
    g.hero.bench = g.hero.bench.filter((u) => u.uid !== uid);
    unit.onBoard = true;
    unit.cell = cell;
    g.hero.board.push(unit);
  } else {
    // move on board; swap if occupied
    if (occupied) occupied.cell = unit.cell;
    unit.cell = cell;
  }
  return g;
}

export function benchUnit(game: Game, uid: string): Game {
  const g = clone(game);
  if (g.phase !== "plan") return game;
  const unit = g.hero.board.find((u) => u.uid === uid);
  if (!unit) return game;
  g.hero.board = g.hero.board.filter((u) => u.uid !== uid);
  unit.onBoard = false;
  unit.cell = null;
  g.hero.bench.push(unit);
  return g;
}

// ---------------------------------------------------------------------------
// Combat & round resolution
// ---------------------------------------------------------------------------

function hpLoss(stage: number, margin: number): number {
  const base = STAGE_BASE_DAMAGE[Math.max(2, Math.min(7, stage))] ?? 6;
  const survivors = 1 + Math.min(8, Math.max(0, margin) / 6);
  return Math.round(base + survivors);
}

function botStep(g: Game, bot: Bot): void {
  const diff = botDiff(g.settings.botDiff);
  const base =
    (stageBaselineStrength(g.stage + 1) - stageBaselineStrength(g.stage)) / ROUNDS_PER_STAGE;
  let grow = base * diff.econOpt * diff.luckMult;
  // Higher difficulties get hidden modifiers so the lobby stays fair vs a buffed hero.
  if (diff.botModifiers) grow *= 1 + 0.04 * diff.botModifiers;
  if (rand(g) < diff.mistakeRate) grow *= 0.3;
  bot.strength += gauss(g, grow, grow * 0.4);
  if (rand(g) < diff.spikeChance) bot.strength += Math.max(0, gauss(g, 6, 3));
}

const FLOORS = [30, 20, 10, 0];
function nearestFloor(gold: number): number {
  return FLOORS.reduce((a, b) => (Math.abs(b - gold) < Math.abs(a - gold) ? b : a));
}

function captureDecision(g: Game): void {
  if (!g.planPre) return;
  const leveled = g.hero.level - g.planStartLevel;
  const rerolls = g.planRerolls;
  const floor = nearestFloor(g.hero.gold);
  let actionKey: string, actionLabel: string;
  if (leveled > 0 && rerolls > 0) {
    actionKey = `level_${g.hero.level}_roll_${floor}`;
    actionLabel = `Level to ${g.hero.level} + roll to ${floor}`;
  } else if (leveled > 0) {
    actionKey = `level_${g.hero.level}`;
    actionLabel = `Level to ${g.hero.level}`;
  } else if (rerolls > 0) {
    actionKey = `roll_${floor}`;
    actionLabel = floor === 0 ? "Roll to 0 (all-in)" : `Roll to ${floor}`;
  } else {
    actionKey = "save";
    actionLabel = "Save";
  }
  g.decisions.push({
    id: g.decisions.length,
    stageRound: `${g.stage}-${g.roundInStage + 1}`,
    pre: g.planPre,
    actionKey,
    actionLabel,
  });
}

interface Combatant {
  isHero: boolean;
  botId?: string;
  strength: number;
}

export function lockAndResolve(game: Game): Game {
  const g = clone(game);
  if (g.phase !== "plan" || !g.hero.alive) return game;

  captureDecision(g);

  // Bots scale up for the round, and refresh their visible (scoutable) board.
  for (const b of g.bots)
    if (b.alive) {
      botStep(g, b);
      syncBotBoard(g, b);
    }

  // Build the lobby and pair it. Conditions buff the hero's combat strength.
  const heroStr =
    heroBoardStrength(g.hero) * g.conditions.strengthMult +
    traitBoostBonus(fieldedTraitCounts(g.hero.board), g.conditions);
  const lobby: Combatant[] = [{ isHero: true, strength: heroStr }];
  for (const b of g.bots) if (b.alive) lobby.push({ isHero: false, botId: b.id, strength: b.strength });

  // Fisher-Yates shuffle on the seeded RNG.
  for (let i = lobby.length - 1; i > 0; i--) {
    const j = Math.floor(rand(g) * (i + 1));
    [lobby[i], lobby[j]] = [lobby[j], lobby[i]];
  }

  const hpById: Record<string, number> = {};
  let heroWon = false;
  let heroRound: { opp: string; oppStr: number; won: boolean; loss: number } | null = null;

  for (let i = 0; i + 1 < lobby.length; i += 2) {
    const a = lobby[i], b = lobby[i + 1];
    const sa = a.strength + gauss(g, 0, 4);
    const sb = b.strength + gauss(g, 0, 4);
    const aWins = rand(g) < winProbability(sa, sb);
    const winner = aWins ? a : b;
    const loser = aWins ? b : a;
    const margin = Math.max(0, winner.strength - loser.strength);
    const loss = hpLoss(g.stage, margin);

    const applyLoss = (c: Combatant) => {
      if (c.isHero) {
        g.hero.hp -= loss * g.conditions.lossDmgMult;
      } else {
        const bot = g.bots.find((x) => x.id === c.botId)!;
        bot.hp -= loss;
        hpById[bot.id] = bot.hp;
      }
    };
    applyLoss(loser);

    // update bot streaks for the scout display
    const setBotStreak = (c: Combatant, won: boolean) => {
      if (c.isHero || !c.botId) return;
      const bot = g.bots.find((x) => x.id === c.botId);
      if (bot) bot.streak = won ? (bot.streak >= 0 ? bot.streak + 1 : 1) : (bot.streak <= 0 ? bot.streak - 1 : -1);
    };
    setBotStreak(winner, true);
    setBotStreak(loser, false);

    if (a.isHero || b.isHero) {
      const opp = a.isHero ? b : a;
      const oppBot = g.bots.find((x) => x.id === opp.botId);
      heroWon = winner.isHero;
      heroRound = {
        opp: oppBot ? oppBot.name : "Ghost",
        oppStr: opp.strength,
        won: winner.isHero,
        loss: winner.isHero ? 0 : loss,
      };
    }
  }

  // Hero streak + income.
  g.hero.streak = heroWon
    ? g.hero.streak >= 0 ? g.hero.streak + 1 : 1
    : g.hero.streak <= 0 ? g.hero.streak - 1 : -1;

  // Eliminations (lowest HP takes the worst open placement).
  const aliveNow = [
    ...(g.hero.alive ? [{ hero: true as const, hp: g.hero.hp }] : []),
    ...g.bots.filter((b) => b.alive).map((b) => ({ hero: false as const, id: b.id, hp: b.hp })),
  ];
  const aliveBefore = aliveNow.length;
  const dying = aliveNow.filter((p) => p.hp <= 0).sort((x, y) => x.hp - y.hp);
  dying.forEach((p, i) => {
    const placement = aliveBefore - i;
    if (p.hero) {
      g.hero.alive = false;
      g.hero.placement = placement;
    } else {
      const bot = g.bots.find((b) => b.id === (p as { id: string }).id)!;
      bot.alive = false;
      bot.placement = placement;
    }
  });

  // Record the hero's matchup for the round banner / log.
  if (heroRound) {
    const entry = {
      stageRound: `${g.stage}-${g.roundInStage + 1}`,
      opponentName: heroRound.opp,
      heroStrength: Math.round(heroStr),
      oppStrength: Math.round(heroRound.oppStr),
      won: heroRound.won,
      hpLoss: heroRound.loss,
    };
    g.log.push(entry);
    g.lastRound = entry;
  }

  // Hero income for next round (only if still alive). Conditions adjust income.
  const c = g.conditions;
  if (g.hero.alive) {
    g.hero.gold +=
      c.baseIncome + interest(g.hero.gold, c.interestCap) + streakBonus(g.hero.streak) +
      (heroWon ? WIN_GOLD : c.lossGold);
    g.hero.xp += XP_PASSIVE;
    if (applyLevelUps(g)) rollShop(g);
  }

  // Advance the clock.
  g.roundInStage += 1;
  let newStage = false;
  if (g.roundInStage >= ROUNDS_PER_STAGE) {
    g.roundInStage = 0;
    g.stage = Math.min(FINAL_STAGE, g.stage + 1);
    newStage = true;
  }
  g.roundNumber += 1;

  // Game over?
  const aliveCount = (g.hero.alive ? 1 : 0) + g.bots.filter((b) => b.alive).length;
  if (!g.hero.alive) {
    g.phase = "gameover";
  } else if (aliveCount <= 1) {
    g.hero.placement = 1;
    g.hero.alive = false;
    g.phase = "gameover";
  } else {
    // Start the next plan phase.
    g.phase = "plan";
    g.planStartLevel = g.hero.level;
    g.planRerolls = 0;
    if (newStage) {
      rollStageEvent(g); // new per-stage lobby event
      // offer a modifier pick at the start of stages 3 and 4
      if ((g.stage === 3 || g.stage === 4) && g.conditions.modifiers.length < g.stage - 1) {
        g.pendingOffer = offerThree(g);
      }
    }
    g.freeRollsLeft = g.conditions.freeRolls; // reset Free Scout for the new plan phase
    g.planPre = toSolverState(g);
  }
  return g;
}

/** Apply a chosen modifier (used by the offer modal). Returns a new Game. */
export function applyOfferPick(game: Game, key: string): Game {
  const g = clone(game);
  pickModifier(g, key); // mutates conditions/hero/pendingOffer/freeRollsLeft
  return g;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export interface ActiveTrait {
  key: string;
  name: string;
  count: number;
  activeBp: number;
  nextBp: number | null;
  kind: "origin" | "role";
  activeBonus: number; // strength bonus currently granted
  nextBonus: number | null; // bonus at the next breakpoint
  toNext: number | null; // units needed to reach the next breakpoint
  breakpoints: number[]; // sorted breakpoint thresholds
}

export function activeTraits(hero: Hero): ActiveTrait[] {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const u of hero.board) {
    if (seen.has(u.key)) continue;
    seen.add(u.key);
    for (const t of u.traits) counts[t] = (counts[t] || 0) + 1;
  }
  const out: ActiveTrait[] = [];
  for (const [key, count] of Object.entries(counts)) {
    const def = TRAITS_BY_KEY[key];
    if (!def) continue;
    const bps = Object.keys(def.breakpoints).map(Number).sort((a, b) => a - b);
    const activeBp = activeBreakpoint(key, count);
    const nextBp = bps.find((b) => b > count) ?? null;
    out.push({
      key, name: def.name, count, activeBp, nextBp, kind: def.kind,
      activeBonus: traitBonus(key, count),
      nextBonus: nextBp != null ? traitBonus(key, nextBp) : null,
      toNext: nextBp != null ? nextBp - count : null,
      breakpoints: bps,
    });
  }
  return out.sort((a, b) => (b.activeBp ? 1 : 0) - (a.activeBp ? 1 : 0) || b.count - a.count);
}

export { heroBoardStrength } from "./strength";
export { toSolverState } from "./solverMap";
