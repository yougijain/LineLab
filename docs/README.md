# LineLab docs

| Document | What it covers |
| --- | --- |
| [`MODEL.md`](MODEL.md) | The abstract auto-battler the Solver reasons about, how the Monte Carlo EV engine works, and how the model stays clear of any specific game's IP. **Start here.** |
| [`specs/arena-v1.md`](specs/arena-v1.md) | v1 Arena build specs — simulation engine, difficulty-scaled bots, review grading, player tiers, visual layer. |
| [`specs/arena-v2.md`](specs/arena-v2.md) | v2 Arena build specs — opponent boards and scouting, economy conditions, forward-looking coach and verdicts, info/clarity layer, optional LLM chat-coach. |
| [`specs/riot-submission-notes.md`](specs/riot-submission-notes.md) | Working notes on Riot's developer registration process. Historical; the shipped product needs none of it. |

The `specs/` documents are build-time design records, not living API reference.
Where a spec and the code disagree, **the code is authoritative**.
