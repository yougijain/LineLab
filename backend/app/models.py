"""
Pydantic models for the LineLab Solver API.

These define the wire contract between the Next.js frontend and the FastAPI
backend: game state, candidate actions, EV results and saved scenarios.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

StagePhase = Literal["early", "midgame", "late"]
Quality = Literal["weak", "medium", "strong"]
Tri = Literal["low", "medium", "high"]
Goal = Literal["top4", "first"]


class GameState(BaseModel):
    """An abstract auto-battler decision point."""
    stage: StagePhase = "midgame"
    hp: int = Field(60, ge=1, le=100)
    gold: int = Field(40, ge=0, le=120)
    level: int = Field(6, ge=1, le=9)
    board_strength: Quality = "medium"
    bench_value: Tri = "medium"
    pairs: int = Field(1, ge=0, le=6)
    items: Tri = "medium"
    lobby_tempo: Tri = "medium"
    goal: Goal = "top4"


class ActionInput(BaseModel):
    """An optional custom line the caller wants evaluated."""
    key: str
    label: str
    level_target: Optional[int] = Field(None, ge=1, le=9)
    roll_to_gold: Optional[int] = Field(None, ge=0, le=120)


class CompareRequest(BaseModel):
    state: GameState
    actions: Optional[List[ActionInput]] = None
    n_rollouts: int = Field(3000, ge=200, le=20000)


class Branch(BaseModel):
    label: str
    prob: float
    expected_placement: float


class LineResultModel(BaseModel):
    key: str
    label: str
    expected_placement: float
    top4_rate: float
    first_rate: float
    bot4_rate: float
    risk: float
    distribution: List[float]
    ev_score: float
    branches: List[Branch]
    explanation: str


class CompareResponse(BaseModel):
    state: GameState
    results: List[LineResultModel]
    best_key: str
    summary: str
    n_rollouts: int
    seed: int
    elapsed_ms: float
    cached: bool


class ReviewDecision(BaseModel):
    """One captured decision point from a played game."""
    state: GameState
    action_key: str
    action_label: str = ""
    stage_round: str = ""          # e.g. "4-2" for display


class ReviewRequest(BaseModel):
    decisions: List[ReviewDecision]
    n_rollouts: int = Field(700, ge=200, le=6000)


class MoveGrade(BaseModel):
    index: int
    stage_round: str
    played_key: str
    played_label: str
    best_key: str
    best_label: str
    gap_ev: float
    gap_place: float
    loss: float
    quality: int                   # 0..100
    label_name: str
    label_meaning: str
    label_color: str
    is_trap: bool
    is_forced: bool


class ReviewResponse(BaseModel):
    grades: List[MoveGrade]
    accuracy: int                  # 0..100
    band: str
    main_leak: str
    study_index: int               # index of the worst decision (for "drill this")


class ScenarioModel(BaseModel):
    id: str
    name: str
    description: str = ""
    state: GameState
    builtin: bool = False


class SaveScenarioRequest(BaseModel):
    name: str
    description: str = ""
    state: GameState
