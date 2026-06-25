"""
Scenario store.

Ships a set of built-in teaching scenarios and lets users save their own. User
scenarios persist to a JSON file so the prototype survives restarts without a
full database (Postgres/Supabase is the production target — see README).
"""

from __future__ import annotations

import json
import logging
import threading
import uuid
from pathlib import Path
from typing import Dict, List

from . import db
from .models import GameState, ScenarioModel

logger = logging.getLogger("linelab.scenarios")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAVED_PATH = DATA_DIR / "scenarios.json"
_lock = threading.Lock()


# Built-in teaching spots — each illustrates one macro decision.
BUILTIN: List[ScenarioModel] = [
    ScenarioModel(
        id="weak-midgame-stabilize",
        name="Weak midgame — stabilize or greed?",
        description="A weak board under health pressure against a fast lobby. "
                    "The classic save-vs-roll decision.",
        state=GameState(stage="midgame", hp=58, gold=42, level=6,
                        board_strength="weak", bench_value="medium", pairs=2,
                        items="medium", lobby_tempo="high", goal="top4"),
        builtin=True,
    ),
    ScenarioModel(
        id="healthy-fast-level",
        name="Healthy early — fast level for tempo",
        description="High HP and a win streak. Can you greed levels to out-tempo "
                    "the lobby?",
        state=GameState(stage="early", hp=88, gold=50, level=5,
                        board_strength="medium", bench_value="high", pairs=1,
                        items="medium", lobby_tempo="medium", goal="first"),
        builtin=True,
    ),
    ScenarioModel(
        id="low-hp-allin",
        name="Low HP late — all-in to survive",
        description="On the brink in stage 5. Roll to zero to live, or hope to "
                    "high-roll a level?",
        state=GameState(stage="late", hp=22, gold=36, level=7,
                        board_strength="weak", bench_value="low", pairs=3,
                        items="high", lobby_tempo="high", goal="top4"),
        builtin=True,
    ),
    ScenarioModel(
        id="capped-board-first",
        name="Strong board — push for first",
        description="A strong, healthy board going for the win. Cap the ceiling "
                    "or play safe?",
        state=GameState(stage="late", hp=64, gold=60, level=8,
                        board_strength="strong", bench_value="medium", pairs=0,
                        items="high", lobby_tempo="medium", goal="first"),
        builtin=True,
    ),
    ScenarioModel(
        id="reroll-floor",
        name="Reroll spot — find the upgrades",
        description="Sitting at level 6 with open pairs. How far do you roll?",
        state=GameState(stage="midgame", hp=50, gold=48, level=6,
                        board_strength="medium", bench_value="high", pairs=4,
                        items="medium", lobby_tempo="medium", goal="top4"),
        builtin=True,
    ),
]


def _ensure_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SAVED_PATH.exists():
        SAVED_PATH.write_text("[]", encoding="utf-8")


def _load_saved() -> List[ScenarioModel]:
    _ensure_file()
    try:
        raw = json.loads(SAVED_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return [ScenarioModel(**item) for item in raw]


def _write_saved(items: List[ScenarioModel]) -> None:
    _ensure_file()
    SAVED_PATH.write_text(
        json.dumps([i.model_dump() for i in items], indent=2),
        encoding="utf-8",
    )


def using_db() -> bool:
    """True when the Supabase Postgres store is active (else JSON fallback)."""
    return db.is_enabled()


def list_scenarios() -> List[ScenarioModel]:
    if db.is_enabled():
        try:
            db.ensure_ready(BUILTIN)
            return db.list_scenarios()
        except Exception:  # pragma: no cover - keep the UI alive on DB outage
            logger.warning("Supabase store unavailable; using JSON fallback", exc_info=True)
    with _lock:
        return BUILTIN + _load_saved()


def save_scenario(name: str, description: str, state: GameState) -> ScenarioModel:
    scenario_id = str(uuid.uuid4())[:8]
    if db.is_enabled():
        try:
            db.ensure_ready(BUILTIN)
            return db.save_scenario(scenario_id, name, description, state)
        except Exception:  # pragma: no cover
            logger.warning("Supabase save failed; using JSON fallback", exc_info=True)
    with _lock:
        saved = _load_saved()
        scenario = ScenarioModel(
            id=scenario_id, name=name, description=description, state=state, builtin=False,
        )
        saved.append(scenario)
        _write_saved(saved)
        return scenario


def delete_scenario(scenario_id: str) -> bool:
    if db.is_enabled():
        try:
            db.ensure_ready(BUILTIN)
            return db.delete_scenario(scenario_id)
        except Exception:  # pragma: no cover
            logger.warning("Supabase delete failed; using JSON fallback", exc_info=True)
    with _lock:
        saved = _load_saved()
        remaining = [s for s in saved if s.id != scenario_id]
        if len(remaining) == len(saved):
            return False
        _write_saved(remaining)
        return True
