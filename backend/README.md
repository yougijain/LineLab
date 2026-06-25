# LineLab Solver — backend

FastAPI + Python Monte Carlo engine for auto-battler macro decisions. Original,
fictional game model — no Riot/TFT IP. See [`../docs/MODEL.md`](../docs/MODEL.md).

## Run

```bash
py -3.13 -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

- Interactive API docs: `http://localhost:8000/docs`
- CORS origins via `LINELAB_CORS_ORIGINS` (comma-separated; defaults to localhost:3000).

## Test & inspect

```bash
.venv/Scripts/python -m pytest          # unit + directional tests
.venv/Scripts/python scripts/calibrate.py   # EV tables for sample spots
.venv/Scripts/python scripts/smoke.py        # endpoint smoke test
.venv/Scripts/python scripts/make_sample.py  # regenerate the frontend offline sample
```

## The engine (core functions)

| Function | Module | Purpose |
| --- | --- | --- |
| `compare_actions(state, actions?, n)` | `evaluator.py` | rank candidate lines by EV |
| `simulate_action(hero, plan, n, seed)` | `rollout.py` | Monte Carlo lobby rollout |
| `estimate_fight_outcome(self, opp)` | `combat_model.py` | round win probability |
| `estimate_hp_loss(stage, margin)` | `combat_model.py` | health lost on a loss |
| `estimate_upgrade_probability(level, gold, tiers)` | `shop.py` | upgrade luck from rolling |
| `generate_explanation(...)` | `explanation.py` | per-line + summary rationale |

## Scenario store (Supabase Postgres)

The scenario store auto-selects its backend:

- **Supabase Postgres** when `SUPABASE_DB_URL` is set — recommended for any real
  deployment. Use the **Session pooler** connection string from the dashboard's
  *Connect* dialog (IPv4, port 5432). The backend connects with `psycopg` 3 over
  a small pool, self-creates the `scenarios` table, and seeds the built-in spots.
- **Local JSON** (`data/scenarios.json`) when it is unset — zero-config fallback
  for local dev and tests.

```bash
# backend/.env
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

.venv/Scripts/python scripts/check_db.py   # verify the live round-trip
```

`GET /api/health` reports which store is active (`"scenario_store": "supabase" | "json"`).

## Notes

- Results are deterministic per state (seed derived from the state) → cacheable
  and reproducible. The in-memory LRU cache (`cache.py`) returns repeats instantly.
