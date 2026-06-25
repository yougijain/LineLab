// Game state types for the LineLab playable auto-chess.

export type Phase = "setup" | "plan" | "resolve" | "gameover";
export type Star = 1 | 2 | 3;

export interface FieldUnit {
  uid: string;
  key: string;
  name: string;
  tier: number;
  star: Star;
  traits: string[];
  role: string;
  items: string[]; // module keys, up to 3
  onBoard: boolean;
  cell: number | null; // board cell index when fielded
}

export interface Bot {
  id: string;
  name: string;
  hp: number;
  strength: number;
  alive: boolean;
  placement: number;
}

export interface Hero {
  hp: number;
  gold: number;
  level: number;
  xp: number;
  streak: number;
  board: FieldUnit[];
  bench: FieldUnit[];
  shop: (string | null)[]; // 5 slots, unit key or null
  itemBank: string[];
  alive: boolean;
  placement: number;
}

export type LearnTier = "beginner" | "standard" | "pro";
export type Goal = "top4" | "first";

export interface Settings {
  learnTier: LearnTier;
  botDiff: string;
  goal: Goal;
  seed: number;
}

export interface SolverState {
  stage: "early" | "midgame" | "late";
  hp: number;
  gold: number;
  level: number;
  board_strength: "weak" | "medium" | "strong";
  bench_value: "low" | "medium" | "high";
  pairs: number;
  items: "low" | "medium" | "high";
  lobby_tempo: "low" | "medium" | "high";
  goal: Goal;
}

// Mirror of the backend MoveGrade (see lib/types.ts MoveGrade) — kept structural
// to avoid a cross-import; the grade is filled in asynchronously after a fight.
export interface DecisionGrade {
  label_name: string;
  label_color: string;
  label_meaning: string;
  quality: number;
  best_label: string;
  played_label: string;
  gap_place: number;
}

export interface DecisionRecord {
  id: number;
  stageRound: string;
  pre: SolverState;
  actionKey: string;
  actionLabel: string;
  grade?: DecisionGrade; // async verdict from /api/review
}

export interface RoundLog {
  stageRound: string;
  opponentName: string;
  heroStrength: number;
  oppStrength: number;
  won: boolean;
  hpLoss: number;
}

export interface Game {
  rngState: number;
  seed: number;
  stage: number;
  roundInStage: number;
  roundNumber: number;
  phase: Phase;
  hero: Hero;
  bots: Bot[];
  pool: Record<string, number>;
  settings: Settings;
  decisions: DecisionRecord[];
  log: RoundLog[];
  lastRound: RoundLog | null;
  // plan-phase capture
  planPre: SolverState | null;
  planStartLevel: number;
  planRerolls: number;
}
