"""
LineLab Solver — FastAPI application.

Exposes the original auto-battler EV engine over HTTP for the Next.js frontend.
No Riot/TFT data, assets, or live-client access is involved anywhere in this
service.
"""

from __future__ import annotations

import os
import time
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import scenarios
from .cache import cache
from .models import (
    Branch,
    CompareRequest,
    CompareResponse,
    GameState,
    LineResultModel,
    SaveScenarioRequest,
    ScenarioModel,
)
from .solver import compare_actions, generate_candidate_actions
from .solver.evaluator import StateInput
from .solver.rollout import ActionPlan

app = FastAPI(
    title="LineLab Solver API",
    version="0.1.0",
    description=(
        "Original auto-battler decision-theory solver. Monte Carlo expected-value "
        "engine for macro decisions (save/level/roll, stabilize vs cap, top-4 vs "
        "first). Contains no Riot Games / Teamfight Tactics IP."
    ),
)

# CORS for the Next.js dev server / deployed frontend.
_origins = os.environ.get(
    "LINELAB_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()] or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _state_input(state: GameState) -> StateInput:
    return StateInput(
        stage=state.stage,
        hp=state.hp,
        gold=state.gold,
        level=state.level,
        board_strength=state.board_strength,
        bench_value=state.bench_value,
        pairs=state.pairs,
        items=state.items,
        lobby_tempo=state.lobby_tempo,
        goal=state.goal,
    )


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "linelab-solver", "version": app.version}


@app.get("/api/config")
def config() -> dict:
    """Expose the option vocabulary so the frontend builder stays in sync."""
    return {
        "stage": ["early", "midgame", "late"],
        "board_strength": ["weak", "medium", "strong"],
        "bench_value": ["low", "medium", "high"],
        "items": ["low", "medium", "high"],
        "lobby_tempo": ["low", "medium", "high"],
        "goal": ["top4", "first"],
        "ranges": {
            "hp": [1, 100], "gold": [0, 120], "level": [1, 9], "pairs": [0, 6],
            "n_rollouts": [200, 20000],
        },
    }


@app.post("/api/compare", response_model=CompareResponse)
def compare(req: CompareRequest) -> CompareResponse:
    cache_key = cache.key(req.model_dump())
    cached = cache.get(cache_key)
    if cached is not None:
        cached = cached.model_copy(update={"cached": True})
        return cached

    state_in = _state_input(req.state)
    custom_actions = None
    if req.actions:
        custom_actions = [
            ActionPlan(key=a.key, label=a.label,
                       level_target=a.level_target, roll_to_gold=a.roll_to_gold)
            for a in req.actions
        ]

    start = time.perf_counter()
    out = compare_actions(state_in, custom_actions, n_rollouts=req.n_rollouts)
    elapsed = (time.perf_counter() - start) * 1000.0

    results = [
        LineResultModel(
            key=r.key, label=r.label, expected_placement=r.expected_placement,
            top4_rate=r.top4_rate, first_rate=r.first_rate, bot4_rate=r.bot4_rate,
            risk=r.risk, distribution=r.distribution, ev_score=r.ev_score,
            branches=[Branch(label=b.label, prob=b.prob,
                             expected_placement=b.expected_placement) for b in r.branches],
            explanation=r.explanation,
        )
        for r in out.results
    ]

    response = CompareResponse(
        state=req.state,
        results=results,
        best_key=out.best_key,
        summary=out.summary,
        n_rollouts=out.n_rollouts,
        seed=out.seed,
        elapsed_ms=round(elapsed, 1),
        cached=False,
    )
    cache.set(cache_key, response)
    return response


@app.get("/api/actions", response_model=List[dict])
def preview_actions(
    stage: str = "midgame", hp: int = 60, gold: int = 40, level: int = 6,
    board_strength: str = "medium", bench_value: str = "medium", pairs: int = 1,
    items: str = "medium", lobby_tempo: str = "medium", goal: str = "top4",
) -> List[dict]:
    """Preview the candidate lines that would be generated for a state."""
    state = StateInput(stage, hp, gold, level, board_strength, bench_value,
                       pairs, items, lobby_tempo, goal)
    return [a.__dict__ for a in generate_candidate_actions(state)]


@app.get("/api/scenarios", response_model=List[ScenarioModel])
def get_scenarios() -> List[ScenarioModel]:
    return scenarios.list_scenarios()


@app.post("/api/scenarios", response_model=ScenarioModel)
def post_scenario(req: SaveScenarioRequest) -> ScenarioModel:
    return scenarios.save_scenario(req.name, req.description, req.state)


@app.delete("/api/scenarios/{scenario_id}")
def remove_scenario(scenario_id: str) -> dict:
    if not scenarios.delete_scenario(scenario_id):
        raise HTTPException(status_code=404, detail="Scenario not found or is built-in")
    return {"deleted": scenario_id}


@app.get("/")
def root() -> dict:
    return {
        "name": "LineLab Solver API",
        "docs": "/docs",
        "endpoints": ["/api/health", "/api/config", "/api/compare",
                      "/api/actions", "/api/scenarios"],
    }
