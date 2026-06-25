// Wire types mirroring the LineLab Solver FastAPI models.

export type StagePhase = "early" | "midgame" | "late";
export type Quality = "weak" | "medium" | "strong";
export type Tri = "low" | "medium" | "high";
export type Goal = "top4" | "first";

export interface GameState {
  stage: StagePhase;
  hp: number;
  gold: number;
  level: number;
  board_strength: Quality;
  bench_value: Tri;
  pairs: number;
  items: Tri;
  lobby_tempo: Tri;
  goal: Goal;
}

export interface Branch {
  label: string;
  prob: number;
  expected_placement: number;
}

export interface LineResult {
  key: string;
  label: string;
  expected_placement: number;
  top4_rate: number;
  first_rate: number;
  bot4_rate: number;
  risk: number;
  distribution: number[]; // 8 normalized probabilities, placement 1..8
  ev_score: number;
  branches: Branch[];
  explanation: string;
}

export interface CompareResponse {
  state: GameState;
  results: LineResult[];
  best_key: string;
  summary: string;
  n_rollouts: number;
  seed: number;
  elapsed_ms: number;
  cached: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  state: GameState;
  builtin: boolean;
}

export const DEFAULT_STATE: GameState = {
  stage: "midgame",
  hp: 58,
  gold: 42,
  level: 6,
  board_strength: "weak",
  bench_value: "medium",
  pairs: 2,
  items: "medium",
  lobby_tempo: "high",
  goal: "top4",
};
