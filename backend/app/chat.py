"""
LLM chat-coach — POST /api/coach/chat (streamed).

A natural-language coach for The Arena, grounded in the solver's EV numbers so
its advice matches the engine instead of hallucinating. Uses the official
Anthropic SDK with model claude-opus-4-8 and streams tokens back as SSE.

Activates ONLY when ANTHROPIC_API_KEY is set (and the `anthropic` package is
installed); otherwise the endpoint reports 503 and the UI shows a disabled note.
It is the user's own key, read server-side, never sent to the browser.
"""

from __future__ import annotations

import json
import os
import time
from collections import defaultdict
from typing import Dict, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from .models import CoachChatRequest

try:
    import anthropic
    _ANTHROPIC_OK = True
except Exception:  # pragma: no cover - optional dependency
    _ANTHROPIC_OK = False

router = APIRouter()
MODEL = "claude-opus-4-8"


def chat_enabled() -> bool:
    return _ANTHROPIC_OK and bool(os.environ.get("ANTHROPIC_API_KEY"))


_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    return _client


SYSTEM_PROMPT = """You are the LineLab Coach — a sharp, concise macro-strategy coach for "The Arena", an ORIGINAL auto-battler. You help one player make the right save/level/roll, stabilize-vs-cap, and top-4-vs-first decisions.

GROUNDING: A second system block gives you the current spot, the EV engine's ranked lines (expected placement, top-4 rate, first rate, ev score, explanation), the best line, and the player's recent decisions. These numbers come from a Monte Carlo solver that simulates the whole game to the end. Treat them as ground truth. When you give advice, cite the relevant line and its numbers ("Rolling here lands 58% top-4 vs 49% if you save"). If the user's instinct disagrees with the EV table, explain the gap using the numbers, don't hand-wave. If no compare data is present, reason qualitatively and say so. Never fabricate numbers the grounding did not give you.

DOMAIN: Stay in auto-battler macro. Vocabulary is generic and original: origins (Pyre, Tide, Storm, Drift, Forge), roles (Marksman, Warden, Mystic, Skirmisher), "stat module" items, gold interest, streaks, level/XP costs, shop odds. NEVER invent or reference real champion, item, or trait names from any other game — this is our own IP. If asked about a real product, decline and redirect to The Arena.

STYLE: Be brief — 2-4 sentences for most answers, a short list at most. Lead with the call, then the reason. Match the player tier: "beginner" = focus on gold/health/the big three moves, avoid jargon; "standard" = tempo and roll timing; "pro" = full EV reasoning, exact numbers, branch lines."""


# Polite per-process rate limit: 1 req / 3s, 20 / 5min, keyed by client id.
_hits: Dict[str, List[float]] = defaultdict(list)


def _allow(cid: str) -> bool:
    now = time.time()
    xs = [t for t in _hits[cid] if now - t < 300]
    _hits[cid] = xs
    if xs and now - xs[-1] < 3.0:
        return False
    if len(xs) >= 20:
        return False
    xs.append(now)
    return True


def _grounding(req: CoachChatRequest) -> str:
    s = req.state
    lines: List[str] = []
    if req.compare:
        for r in req.compare.results[:6]:
            lines.append(
                f"- {r.label} (key={r.key}): exp_place={r.expected_placement:.2f}, "
                f"top4={r.top4_rate:.0%}, first={r.first_rate:.0%}, ev={r.ev_score:.3f} "
                f"-- {r.explanation}"
            )
        best = req.compare.best_key
        proj = req.compare.summary
    else:
        best, proj = "(none)", "(no live compare available)"
    log = " -> ".join(
        f"{d.stage_round or '?'}:{d.action_label or d.action_key}" for d in req.log[-12:]
    ) or "(none)"
    return (
        f"## Current spot\nstage={s.stage} hp={s.hp} gold={s.gold} level={s.level} "
        f"board={s.board_strength} bench={s.bench_value} pairs={s.pairs} items={s.items} "
        f"tempo={s.lobby_tempo} goal={s.goal}\n\n"
        f"## Solver-ranked lines (defer to these EV numbers)\n"
        f"{chr(10).join(lines)}\nBest line key: {best}\nSummary: {proj}\n\n"
        f"## Recent decisions\n{log}\n\n"
        f"## Player tier: {req.tier}"
    )


@router.post("/api/coach/chat")
def coach_chat(req: CoachChatRequest):
    if not chat_enabled():
        raise HTTPException(503, "Chat coach disabled (ANTHROPIC_API_KEY not set).")
    if not _allow("local"):
        raise HTTPException(429, "Slow down — one question every few seconds.")

    messages = [{"role": t.role, "content": t.content} for t in req.history[-8:]]
    messages.append({"role": "user", "content": req.message})

    client = _get_client()

    def gen():
        try:
            with client.messages.stream(
                model=MODEL,
                max_tokens=1024,
                system=[
                    {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
                    {"type": "text", "text": _grounding(req)},
                ],
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'t': text})}\n\n"
            yield 'data: {"done": true}\n\n'
        except Exception as e:  # pragma: no cover - network/runtime
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
