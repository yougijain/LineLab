# LineLab

An independent, two-product educational website for auto-battler players.

1. **LineLab Solver** *(built — Product A)* — an **original** auto-battler
   decision-theory engine. A "poker solver for the economy game": describe a
   spot and it runs thousands of Monte Carlo games to compare your lines by
   expected placement, top-4 / first rate, and risk. It runs on a wholly
   **fictional** game model and contains **no Riot Games / Teamfight Tactics
   names, assets, data, combat formulas, or live-client access**.

2. **LineLab TFT Study** *(shell only — Product B)* — a planned Teamfight
   Tactics study companion (static patch guides, comps, flashcards, and
   self-player post-game review). The UI shell exists with neutral placeholders;
   the real TFT content/assets/API features are added **only after Riot
   developer registration and clearance**.

> Why split it this way? Riot's developer policy encourages tools that help
> players improve over time — especially pre-game best practices and post-game
> analysis — while disallowing dynamic real-time info, opponent scouting, and
> apps that dictate in-game decisions. The Solver sidesteps IP entirely by being
> an original model; the Study product stays static/pre-game or strictly
> post-game on the player's own data. See [`/compliance`](frontend/app/compliance/page.tsx)
> and [`docs/MODEL.md`](docs/MODEL.md).

---

## Repository layout

```
LineLab/
├── backend/            FastAPI + Python Monte Carlo solver (the technical core)
│   ├── app/
│   │   ├── main.py            FastAPI app + endpoints
│   │   ├── models.py          Pydantic wire models
│   │   ├── config.py          Genericized game constants
│   │   ├── cache.py           LRU result cache
│   │   ├── scenarios.py       Built-in + saved scenario store
│   │   └── solver/            The engine
│   │       ├── economy.py     gold / interest / streaks
│   │       ├── leveling.py    XP / level costs
│   │       ├── shop.py        tiered odds + estimate_upgrade_probability
│   │       ├── units.py       original fictional roster
│   │       ├── traits.py      original fictional trait system
│   │       ├── items.py       original fictional stat modules
│   │       ├── combat_model.py estimate_fight_outcome / estimate_hp_loss
│   │       ├── rollout.py     Monte Carlo lobby engine + simulate_action
│   │       ├── evaluator.py   compare_actions + EV aggregation
│   │       └── explanation.py natural-language rationale
│   ├── tests/                 pytest suite
│   └── scripts/               calibrate.py, smoke.py, make_sample.py
│
├── frontend/           Next.js 14 + TypeScript + Tailwind website
│   ├── app/                   landing, solver, study, compliance, terms, privacy
│   ├── components/            Nav, Footer, solver/*
│   └── lib/                   api client, types, embedded sample fallback
│
└── docs/               MODEL.md, RIOT_SUBMISSION.md
```

---

## Quick start

### 1. Backend (the solver engine)

```bash
cd backend
py -3.13 -m venv .venv                 # Windows; use python3 on macOS/Linux
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m pytest         # run the test suite
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

API now at `http://localhost:8000` (interactive docs at `/docs`).

Useful scripts:

```bash
.venv/Scripts/python scripts/calibrate.py   # print EV tables for sample spots
.venv/Scripts/python scripts/smoke.py        # end-to-end API smoke test
```

### 2. Frontend (the website)

```bash
cd frontend
npm install
cp .env.local.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                            # http://localhost:3000
```

The Solver page calls the backend live. If the backend is unreachable it falls
back to an embedded sample response (with a banner) so the site stays reviewable
offline — handy for a static preview.

---

## The Solver API

| Method | Path                       | Purpose                                   |
| ------ | -------------------------- | ----------------------------------------- |
| GET    | `/api/health`              | liveness                                  |
| GET    | `/api/config`              | option vocabulary for the builder         |
| POST   | `/api/compare`             | compare candidate lines for a game state  |
| GET    | `/api/actions`             | preview the candidate lines for a state   |
| GET    | `/api/scenarios`           | built-in + saved teaching spots           |
| POST   | `/api/scenarios`           | save a scenario                           |
| DELETE | `/api/scenarios/{id}`      | delete a saved scenario                   |

Example:

```bash
curl -s localhost:8000/api/compare -H 'content-type: application/json' -d '{
  "state": {"stage":"midgame","hp":58,"gold":42,"level":6,
            "board_strength":"weak","bench_value":"medium","pairs":2,
            "items":"medium","lobby_tempo":"high","goal":"top4"},
  "n_rollouts": 2000
}'
```

---

## What this is **not** (by design)

No live TFT solver, no live board reader, no TFT clone simulator, no opponent
scouting, no game-client automation/memory reading, and no "buy/roll/level now"
in-game assistant. See [`docs/MODEL.md`](docs/MODEL.md) for the full model and
compliance rationale, and [`docs/RIOT_SUBMISSION.md`](docs/RIOT_SUBMISSION.md)
for the developer-registration plan.

## Deployment targets

- **Frontend:** Vercel (static export-friendly; set `NEXT_PUBLIC_API_URL`).
- **Backend:** Render / Fly.io / Railway (`uvicorn app.main:app`).
- **Database (later):** Supabase / Neon / Postgres replaces the JSON scenario
  store for user accounts and saved scenarios.
