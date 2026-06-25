# LineLab

**Learn the handful of Teamfight Tactics decisions that get you to top 4.**

LineLab is an independent, beginner-focused tool for learning TFT *fundamentals* —
the durable, patch-agnostic habits (economy, leveling, rolling, items, positioning,
reading the lobby) that separate a bleeding-out new player from a reliable top-4
finisher. It teaches by giving you one clear move at a time, then lets you drill it
against a live coach.

It uses **no Riot Games assets, artwork, champion data, or live-client access**, and
is not affiliated with or endorsed by Riot Games. The Arena and Solver run on an
original Monte Carlo simulation model.

---

## What's inside

- **Learn** (`/learn`) — 14 ranked fundamentals in 5 modules, with a "must-know 6"
  shown first and a "Go deeper" reveal. Each card is a single actionable rule plus
  the common mistake it fixes.
- **Arena** (`/play`) — a playable auto-battler with a live coach that calls one move
  at a time, so you drill the habits instead of reading about them. Includes a
  post-game review that grades every macro decision.
- **Solver** (`/solver`) — describe any spot and get one recommended move
  (**ROLL / LEVEL / SAVE / STABILIZE**) with a plain-English why. The full
  expected-value table, decision tree, and scenario builder live behind an
  **Advanced** toggle.

The coach never asks you to rate your own board — it reads health, gold, level, and
board strength for you, runs thousands of fast simulated games, and collapses the
result into a single verb.

## Tech stack

| Layer | Stack |
|------|-------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI + Python, a Monte Carlo expected-value engine |
| Database | Supabase Postgres (saved scenarios); falls back to a local JSON store |
| Optional | AI chat-coach via the Anthropic SDK, off unless `ANTHROPIC_API_KEY` is set |

## Repository layout

```
backend/    FastAPI app + Monte Carlo solver
  app/
    main.py            FastAPI app + endpoints
    models.py          Pydantic wire models
    solver/            the engine (economy, leveling, shop, rollout, evaluator, …)
    chat.py            optional Anthropic-backed chat-coach
  tests/               pytest suite
frontend/   Next.js app
  app/                 landing, learn, play (Arena), solver, compliance, terms, privacy
  lib/game/            client-side Arena engine
  lib/coach/           one-verb coach (ROLL/LEVEL/SAVE/STABILIZE)
  lib/learn/           fundamentals curriculum content
  components/          UI (Nav, Footer, play/*, solver/*, learn/*, coach/*)
docs/       design + model notes
```

## Running locally

You need **two** processes: the Python backend (the simulation engine) and the
Next.js frontend (the UI).

### 1. Backend (port 8000)

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # optional: fill in for Supabase / chat-coach
uvicorn app.main:app --port 8000
```

The backend runs fine with an empty `.env` — it falls back to a local JSON scenario
store and leaves the AI chat-coach disabled. `GET /api/health` reports which stores
are active. Interactive API docs are at `/docs`.

### 2. Frontend (port 3000)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if not localhost:8000
npm run dev
```

Open <http://localhost:3000/learn> to start with the fundamentals, or
<http://localhost:3000/play> to practice in the Arena. If the backend is
unreachable, the Solver falls back to an embedded sample (with a banner) so the site
stays reviewable offline.

### Environment variables

Real secrets live only in **gitignored** `.env` files (never committed). See
`backend/.env.example` and `frontend/.env.local.example`. Key ones:

- `SUPABASE_DB_URL` — Postgres session-pooler connection string (optional; enables the Supabase scenario store)
- `ANTHROPIC_API_KEY` — enables the AI chat-coach (optional)
- `NEXT_PUBLIC_API_URL` — where the frontend finds the backend (defaults to `http://localhost:8000`)

## The Solver API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/health` | liveness + which stores/features are active |
| GET | `/api/config` | option vocabulary for the scenario builder |
| POST | `/api/compare` | compare candidate lines for a game state |
| POST | `/api/project` | project a chosen line forward (HP/placement/survival per stage) |
| POST | `/api/review` | grade a sequence of past decisions |
| POST | `/api/coach/chat` | streaming AI chat-coach (requires `ANTHROPIC_API_KEY`) |
| GET/POST/DELETE | `/api/scenarios` | built-in + saved teaching spots |

```bash
curl -s localhost:8000/api/compare -H 'content-type: application/json' -d '{
  "state": {"stage":"midgame","hp":58,"gold":42,"level":6,
            "board_strength":"weak","bench_value":"medium","pairs":2,
            "items":"medium","lobby_tempo":"high","goal":"top4"},
  "n_rollouts": 2000
}'
```

## Compliance

LineLab teaches universal TFT concepts using the game's own vocabulary (gold,
interest, levels, rolls, traits, augments) but ships no Riot artwork, icons,
champion data, or patch tables, and never connects to the live game — no overlay,
real-opponent scouting, in-client "do this now" prescriptions, automation, or memory
reading. The Arena's opponents are simulated. See
[`/compliance`](frontend/app/compliance/page.tsx) for the full statement.

## Deployment

- **Frontend** → Vercel (set `NEXT_PUBLIC_API_URL` to your backend's URL).
- **Backend** → Render / Fly.io / Railway (`uvicorn app.main:app`).
- **Database** → Supabase Postgres (set `SUPABASE_DB_URL`).

Set all secrets as host environment variables — never commit them.

## License

[MIT](LICENSE) © 2026 yougijain

---

*Teamfight Tactics and TFT are trademarks of Riot Games, Inc., referenced here
nominatively for identification and educational purposes only. LineLab is not
affiliated with, endorsed by, or sponsored by Riot Games.*
