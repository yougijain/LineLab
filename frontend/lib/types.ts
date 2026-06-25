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

// ---- Game review (Line Review) ----

export interface ReviewDecisionInput {
  state: GameState;
  action_key: string;
  action_label: string;
  stage_round: string;
}

export interface MoveGrade {
  index: number;
  stage_round: string;
  played_key: string;
  played_label: string;
  best_key: string;
  best_label: string;
  gap_ev: number;
  gap_place: number;
  loss: number;
  quality: number;
  label_name: string;
  label_meaning: string;
  label_color: string;
  is_trap: boolean;
  is_forced: boolean;
}

export interface ReviewResponse {
  grades: MoveGrade[];
  accuracy: number;
  band: string;
  main_leak: string;
  study_index: number;
}

// ---- Future-stage projection ----

export interface StageProjection {
  stage: number;
  survival: number;
  exp_hp: number;
  strength_vs_lobby: number;
  exp_placement: number;
}

export interface ProjectResponse {
  state: GameState;
  line_key: string;
  line_label: string;
  trajectory: StageProjection[];
  watch_next: string;
  final_placement: number;
  top4_rate: number;
  cached: boolean;
}

// ---- Chat coach ----

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface HealthInfo {
  status: string;
  scenario_store: string;
  chat_coach: boolean;
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
