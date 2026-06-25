"""
Optional Supabase (Postgres) scenario store.

Activated automatically when ``SUPABASE_DB_URL`` is set — use the **Session
pooler** connection string from the Supabase dashboard's *Connect* dialog for a
persistent FastAPI backend. When the variable is unset (or psycopg is not
installed), the app falls back to the local JSON store in ``scenarios.py`` so the
prototype still runs with zero configuration.

The data layer is plain SQL via psycopg 3 over a small connection pool. The
postgres role bypasses RLS, so no service-role key is needed here.
"""

from __future__ import annotations

import os
import threading
from typing import List, Optional

try:  # psycopg is optional; degrade gracefully if missing.
    from psycopg.types.json import Json
    from psycopg_pool import ConnectionPool

    _PSYCOPG_AVAILABLE = True
except Exception:  # pragma: no cover - import guard
    _PSYCOPG_AVAILABLE = False

from .models import GameState, ScenarioModel

_pool: "Optional[ConnectionPool]" = None
_pool_lock = threading.Lock()
_ready = False

SCHEMA = """
create table if not exists public.scenarios (
  id text primary key default (gen_random_uuid())::text,
  name text not null,
  description text not null default '',
  state jsonb not null,
  builtin boolean not null default false,
  user_id uuid,
  created_at timestamptz not null default now()
);
"""


def _conninfo() -> Optional[str]:
    url = os.environ.get("SUPABASE_DB_URL", "").strip()
    if not url:
        return None
    if "sslmode=" not in url:  # Supabase requires TLS.
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


def is_enabled() -> bool:
    return _PSYCOPG_AVAILABLE and _conninfo() is not None


def _configure(conn) -> None:
    # Disable prepared statements so the same code works on the transaction
    # pooler (6543) as well as the session pooler (5432) and direct connection.
    conn.prepare_threshold = None


def _get_pool() -> "ConnectionPool":
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                pool = ConnectionPool(
                    _conninfo(),
                    min_size=1,
                    max_size=5,
                    kwargs={"autocommit": True},
                    configure=_configure,
                    open=False,
                )
                pool.open()
                _pool = pool
    return _pool


def ensure_ready(builtins: List[ScenarioModel]) -> None:
    """Create the table if needed and seed built-in spots (idempotent)."""
    global _ready
    if _ready:
        return
    with _get_pool().connection() as conn:
        conn.execute(SCHEMA)
        for s in builtins:
            conn.execute(
                "insert into public.scenarios (id, name, description, state, builtin) "
                "values (%s, %s, %s, %s, true) on conflict (id) do nothing",
                (s.id, s.name, s.description, Json(s.state.model_dump())),
            )
    _ready = True


def _row_to_model(row) -> ScenarioModel:
    id_, name, description, state, builtin = row
    return ScenarioModel(
        id=id_, name=name, description=description or "",
        state=GameState(**state), builtin=builtin,
    )


def list_scenarios() -> List[ScenarioModel]:
    with _get_pool().connection() as conn:
        cur = conn.execute(
            "select id, name, description, state, builtin from public.scenarios "
            "order by builtin desc, created_at asc"
        )
        return [_row_to_model(r) for r in cur.fetchall()]


def save_scenario(id_: str, name: str, description: str, state: GameState) -> ScenarioModel:
    with _get_pool().connection() as conn:
        conn.execute(
            "insert into public.scenarios (id, name, description, state, builtin) "
            "values (%s, %s, %s, %s, false)",
            (id_, name, description, Json(state.model_dump())),
        )
    return ScenarioModel(id=id_, name=name, description=description, state=state, builtin=False)


def delete_scenario(id_: str) -> bool:
    with _get_pool().connection() as conn:
        cur = conn.execute(
            "delete from public.scenarios where id = %s and builtin = false", (id_,)
        )
        return cur.rowcount > 0


def close() -> None:
    global _pool, _ready
    if _pool is not None:
        _pool.close()
        _pool = None
    _ready = False
