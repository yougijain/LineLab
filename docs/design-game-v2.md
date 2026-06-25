# LineLab Arena v2 — design specs (design workflow)


## SPEC: opponent_boards_scouting

I have all I need. Here is the implementation-ready spec.

---

## TASK A — Opponent Boards + Scouting

### 1) Extended `Bot` shape (`types.ts`)

Promote the abstract bot, keeping `strength`/`hp`/`placement` as the source of truth for combat and layering a *visible* board on top.

```ts
export interface BotBoard {
  units: FieldUnit[];        // reuse FieldUnit — read-only, cell-placed
  level: number;
  traits: Record<string, number>;  // fieldedTraitCounts(units)
  itemCount: number;
  identityKey: string;       // e.g. "pyre_mystic"
  identityLabel: string;     // "Pyre Casters"
  buildLine: string;         // one-liner: "Forcing Pyre, wants The Kindler"
  carryKey: string | null;   // primary trait/role they contest
}

export interface Bot {
  id: string; name: string;
  hp: number; strength: number; alive: boolean; placement: number;
  streak: number;            // +win / -loss streak (mirror hero.streak)
  board: BotBoard;           // NEW — visible, derived
  policyKey: string;         // which BotPolicy seeded this bot (see §5)
}
```

### 2) Consistency with abstract combat

Combat keeps using `bot.strength` (engine.ts:380-381, `botStep`). The board is a **rendering of that scalar**, not a parallel sim. In `botStep(g, bot)`, after `bot.strength` updates, call a new `syncBotBoard(g, bot)` (in `engine.ts`) that **reconstructs `bot.board.units` so `Σ unitStrength(u) + Σ traitBonus ≈ bot.strength`** using the existing `strength.ts` helpers:

- Target unit count `N = boardSizeForLevel(bot.board.level)` (= level, capped 9).
- Pick units from the bot's **identity pool** (units sharing its 2 identity traits, from `ROSTER`), tier-weighted by current stage via the existing shop-odds table in `config.ts`.
- Assign `star`/`items` greedily so the summed `heroBoardStrength`-style value lands within ±5% of `bot.strength`; scale star-ups and `itemCount` to absorb the remainder. Reuse `unitStrength`, `fieldedTraitCounts`, `traitBonus` verbatim so a scouted board's implied strength == its combat strength. This makes the board *descriptive of reality*, so scouting never lies.

`bot.board.level` advances on a fixed per-policy curve (§5); `itemCount` = `round((stage-1) * policy.itemPace)`.

### 3) Scouting UX — `ScoutDrawer.tsx`

Make `OpponentsRail` tiles clickable: add `onScout?: (id: string) => void` and an `onClick` on the existing `card` div (add `cursor-pointer hover:ring-1 hover:ring-brand/40`). `play/page.tsx` holds `scoutId` state and renders `<ScoutDrawer bot={bots.find(...)} learnTier={...} onClose=.../>`.

**Components (`frontend/components/play/`):**
- `ScoutDrawer.tsx` — right slide-over (`fixed right-0 top-0 h-full w-[360px] card`), header = name + HP bar + streak chip.
- `ScoutBoard.tsx` — thin wrapper that renders `bot.board.units` through the existing `Board.tsx` in a new `readonly` mode (add `readonly?: boolean` prop to `Board.tsx`; when true, disable drag handlers and selection — units render via existing `UnitCard`).
- `ScoutThreat.tsx` — comp identity label + `chip` row of active traits (use `seg`/`chip`), item count `num`, and the `buildLine`.

**Tier gating (drive from `LEARN_TIERS`):**
- **beginner** — `ScoutThreat` only: `identityLabel` + a **threat level** chip (Low/Even/High, from `threatBand(bot, hero)`; see §4). No board, no items, no econ. (`coachTree:false`, `showItems:false`.)
- **standard** — adds `ScoutBoard` (units + stars), active traits, `itemCount`; hides econ/level read.
- **pro** — full: board + per-unit items, `level`, `itemCount`, HP, streak, and an econ read line (`"L${level} • ${itemCount} items • ${streak>0?'+':''}${streak} streak"`). Gate on `coachTree`/`showItems:true`.

### 4) Lobby Threat Board — `ThreatBoard.tsx`

Rendered above `OpponentsRail`. Two `chip` clusters:

**Strongest:** sort live bots by `strength` desc; top tile gets a red `chip` "Top threat: {name}". `threatBand(bot, hero) = bot.strength/heroBoardStrength(hero)` → `<0.9 Low`, `0.9–1.1 Even`, `>1.1 High`.

**Contention** (pool pressure) — compute from `game.pool` + bot boards:
```ts
// strength.ts (new)
export function poolContention(game: Game): { key: string; label: string; pressure: number; rivals: string[] }[]
```
For each unit key the **hero** holds/wants (`hero.board ∪ hero.bench` keys), count rival copies fielded across all bot boards (`Σ bot.board.units.filter(u=>u.key===key).length`). `pressure = rivalCopies / POOL_COPIES_PER_UNIT[tier]`. Same for traits: bots sharing the hero's top trait raise `traitContention`. Surface the top 2–3 as amber `chip`s: `"Sparrowtail contested ×3"` / `"2 rivals forcing Drift"`. Beginner sees only a single summary chip ("Your carry is contested"); pro sees per-unit pressure `num`.

### 5) Performance + per-difficulty params (`tiers.ts`)

Bots never drag items or run a shop loop — `syncBotBoard` is **O(N≤9) per bot per round**, called once in `botStep`. Add a per-difficulty board policy to `BotDifficulty`:

```ts
// extend BotDifficulty
boardSizePace: number;  // units fielded ≈ min(9, 1 + round(stage*pace))
levelPace: number;      // level ≈ min(9, 2 + floor(stage*levelPace))
itemPace: number;       // items per stage
starBias: number;       // prob a fielded unit is 2★+ (consistency knob)
identityStrictness: number; // 0..1 — how on-trait their picks are
```

| key | boardSizePace | levelPace | itemPace | starBias | identityStrictness |
|---|---|---|---|---|---|
| casual | 0.55 | 0.55 | 0.6 | 0.15 | 0.45 |
| easy | 0.65 | 0.65 | 0.8 | 0.25 | 0.6 |
| ranked | 0.75 | 0.75 | 1.0 | 0.4 | 0.78 |
| hard | 0.85 | 0.85 | 1.2 | 0.55 | 0.9 |
| apex | 0.95 | 0.95 | 1.4 | 0.7 | 0.97 |

Each bot draws a fixed `identityKey` at init (in engine.ts:139 loop) from a curated list of trait pairs present in `ROSTER` (e.g. `pyre_mystic`, `drift_marksman`, `tide_warden`, `forge_skirmisher`, `storm_mystic`), seeded by `rand(g)` so a lobby is reproducible and comps are visibly distinct. `identityStrictness` controls how often `syncBotBoard` picks off-identity filler vs on-trait units.

**Files touched:** `types.ts` (Bot/BotBoard), `tiers.ts` (policy params + identity list), `strength.ts` (`syncBotBoard` helper inputs, `poolContention`, `threatBand`), `engine.ts` (`syncBotBoard` in `botStep`, init identity + `streak`), `OpponentsRail.tsx` (clickable), `Board.tsx` (`readonly` mode), new `ScoutDrawer.tsx`/`ScoutBoard.tsx`/`ScoutThreat.tsx`/`ThreatBoard.tsx`, `play/page.tsx` (`scoutId` state + wiring).

## SPEC: econ_conditions

# TASK B — Game-Wide Conditions

## 1) Two layers

**Modifiers** (per-game, augment-like): chosen at setup or offered as **pick‑1‑of‑3** at the start of plan phases **2-1, 3-1, 4-1** (gated on `game.stage`/`roundInStage===0`). Once picked they persist all game. Up to 3 active.

**Lobby Events** (per-stage, encounter-like): one global condition seeded for **each stage**, affecting all 8 players (hero + bots) symmetrically. Deterministically chosen from the seeded RNG at stage rollover (in `lockAndResolve` where `g.stage` advances). Short-lived (one stage), low-magnitude.

## 2) Catalog

Each entry: `key — Name (tier) effect → engine hook`. Tiers: **Common / Rare / Prismatic**.

**MODIFIERS — ECON**
- `compound — Compound Vault` (Rare) `INTEREST_CAP +1 → 6` → `config.interest()` reads `g.conditions.interestCap`.
- `dividend — Steady Dividend` (Common) `BASE_INCOME +1` → income line in `lockAndResolve`.
- `tuition — Tuition Waiver` (Common) `XP_BUY_COST 4→3` → `buyXP()`.
- `bargain — Bargain Bin` (Common) `REFRESH_COST 2→1` → `refreshShop()`.
- `safetynet — Safety Net` (Rare) on a loss, gain `+2` gold (extra) → income line, `if (!heroWon)`.

**MODIFIERS — COMBAT**
- `phalanx — Phalanx Drill` (Rare) board strength `×1.06` → multiply `heroBoardStrength` result in `lockAndResolve`.
- `cushion — Soft Landing` (Common) `hpLoss ×0.85` when you lose → `hpLoss()` scaled by `g.conditions.lossDmgMult`.
- `overclock — Overclock Core` (Prismatic) board strength `×1.12` but `hpLoss ×1.10` → both multipliers.

**MODIFIERS — TRAIT**
- `pyreFocus — Ember Focus` (Rare) `+4` flat strength if the **pyre** breakpoint is active → additive bonus in `heroBoardStrength` keyed by trait family in `g.conditions.traitBoost`.
- `forgeFocus — Anvil Focus` (Rare) same for **forge**.
- `roleFocus — Vanguard Focus` (Prismatic) `+6` if any role trait ≥ its 2nd breakpoint.

**MODIFIERS — TEMPO**
- `scout — Free Scout` (Common) one free `refreshShop` per plan phase → `g.conditions.freeRolls` decremented in `refreshShop()` before charging.
- `headstart — Head Start` (Prismatic) immediate `+1` level + `+3` gold on pick → applied once in the pick handler.

**LOBBY EVENTS (stage-wide, symmetric)**
- `goldRush — Gold Rush` (Common) everyone `+2` income this stage → hero income line + bots' `econOpt` proxy (`botStep` grow `×1.05`).
- `austerity — Austerity` (Common) `INTEREST_CAP −1` this stage → `interest()`.
- `bloodyStage — Bloodbath` (Rare) `hpLoss ×1.15` for all → `hpLoss()` and bot `bot.hp` damage.
- `cheapXP — Open Library` (Common) `XP_BUY_COST −1` this stage → `buyXP()`; bots get `+0.05 econOpt`.

## 3) Data shapes

In `types.ts`:

```ts
export type CondTier = "common" | "rare" | "prismatic";
export type CondLayer = "modifier" | "event";
export interface ConditionDef {
  key: string; name: string; blurb: string;
  layer: CondLayer; tier: CondTier;
  category: "econ" | "combat" | "trait" | "tempo";
  // effect knobs (all optional, default no-op)
  interestCapDelta?: number; baseIncomeDelta?: number; lossGold?: number;
  xpCostDelta?: number; refreshCostDelta?: number; freeRolls?: number;
  strengthMult?: number; lossDmgMult?: number;
  traitBoost?: { family: string; minBp: number; flat: number };
  onPick?: { level?: number; gold?: number };
}
export interface ActiveConditions {        // stored on Game
  modifiers: string[];                       // chosen modifier keys
  event: string | null;                      // current stage event key
  // derived per-plan, recomputed by recomputeConditions():
  interestCap: number; baseIncome: number; xpCost: number;
  refreshCost: number; freeRolls: number;
  strengthMult: number; lossDmgMult: number; lossGold: number;
  traitBoost: Record<string, { minBp: number; flat: number }>;
}
```

Add `conditions: ActiveConditions` and `pendingOffer: string[] | null` to `Game`. New file **`frontend/lib/game/conditions.ts`** holds `CONDITION_CATALOG`, `recomputeConditions(g)` (folds modifiers+event into the derived numbers), `offerThree(g)` (seeded 3-pick weighted by tier: common 0.6/rare 0.3/prismatic 0.1, Beginner forces all-common and offers 2), `pickModifier(g,key)`, and `rollStageEvent(g)`.

**Engine hooks:** replace literals — `interest(gold, cap=g.conditions.interestCap)`, `REFRESH_COST→g.conditions.refreshCost`, `XP_BUY_COST→g.conditions.xpCost`, income `BASE_INCOME→g.conditions.baseIncome` plus `lossGold`, `heroStr*=g.conditions.strengthMult + traitBoost`, `hpLoss(...)*=g.conditions.lossDmgMult`. Call `recomputeConditions(g)` whenever stage advances or a modifier is picked. Bots receive symmetric event effects via `botStep` multipliers and, at higher difficulty, hidden modifiers: in `tiers.ts` add `botModifiers: number` (hard=1, apex=2) granting `tempoFactor`/`econOpt` bumps so the lobby stays fair.

**Solver mirror (`solverMap.ts`):** conditions shift the *derived* buckets the solver already understands — no API schema change needed for most:
- `interestCapDelta`/`baseIncome`/`xpCost`/`refreshCost` → fold into the gold/tempo reasoning by nudging `lobby_tempo` down one bucket when the hero has econ modifiers (cheaper to spike), and pass an extra optional field.
- `strengthMult`/`traitBoost` → recompute `ratio = hs*strengthMult / baseline` so `board_strength` already reflects them.
- Add **two optional fields** to `StateInput` (evaluator.py, models.py, rollout.py) defaulting to neutral: `interest_cap:int=5` and `loss_dmg_mult:float=1.0`. `toSolverState` sets them from `g.conditions`. The rollout's economy step uses `interest_cap`; combat `hpLoss` uses `loss_dmg_mult`. Events being symmetric mostly cancel — approximate the *asymmetric* part (bonus that helps low-strength boards relatively more) by leaving them out except `bloodyStage`/`cheapXP`, which map to `loss_dmg_mult` and a `−1` effective xp cost in rollout. Conditions the solver can't model exactly (trait-family flats) are folded into `board_strength` upstream, so the solver sees their net effect, not the mechanism.

## 4) UX

**Offer modal** (`OfferModal.tsx`, shown when `game.pendingOffer`): full-screen `card` with three `card`-tiles in a `seg` row; each tile shows Name, a `chip` tier badge (color by tier), `label` category, blurb, and the `num` effect. Click selects → `pickModifier`, clears `pendingOffer`. Keyboard 1/2/3.

**Active strip** in `StatusBar`: after Stage, a right-aligned row of `chip`s — one per active modifier (icon + short name) plus one highlighted `chip` for the current Lobby Event prefixed "Stage:". Hover shows blurb. Gated: Beginner shows only econ-modifier chips and hides the event chip; Standard/Pro show all.

**Coach/chat:** `CoachPanel` prepends a one-line banner when an event is live ("Open Library — XP is 1 cheaper this stage; leveling lines are favored"). Because conditions feed the solver via derived buckets, ranked lines already reflect them; the explanation string just names the active condition. Beginner gets the plain-English sentence only; Pro sees the numeric delta (e.g. "interest cap 6 → save to 60g").

## 5) Balance

Modifiers are sized at roughly **+3-6% placement EV** each (Prismatic ~ two Rares). Bots get `botModifiers` (hard 1 / apex 2) drawn from the same catalog so they don't fall behind a buffed hero. Lobby Events are symmetric and capped at `±2` gold / `×1.15` damage / `±1` cap so they swing tempo without deciding games. Casual/Easy lobbies disable bot modifiers entirely.

**Files:** new `frontend/lib/game/conditions.ts`, `frontend/components/play/OfferModal.tsx`; edits to `types.ts`, `config.ts` (param the helpers), `engine.ts`, `solverMap.ts`, `tiers.ts`, `StatusBar.tsx`, `CoachPanel.tsx`, `play/page.tsx` (render modal); backend `evaluator.py`, `models.py`, `rollout.py`, `main.py` (two optional StateInput fields).

## SPEC: coach_future_and_verdicts

I have everything needed. Here is the implementation-ready spec.

---

# TASK C — Comprehensive Coach: Future-Stage Projection + Per-Turn Verdicts

## 1) Future Projection — backend

**Record per-stage snapshots in the hero rollout.** In `rollout.py`, extend `_one_rollout` to capture the hero's state at each stage boundary. Add to `SimResult`:

```python
@dataclass
class StageSnap:
    stage: int
    hp: float
    hero_strength: float
    lobby_avg_strength: float   # mean strength of still-alive opponents
    alive: bool                 # hero alive at this stage
    placement_so_far: int       # 0 if still in
@dataclass
class SimResult:
    placements: List[int] = field(default_factory=list)
    first_fight_wins: List[bool] = field(default_factory=list)
    snaps: List[List[StageSnap]] = field(default_factory=list)  # one list per rollout
```

In `_one_rollout`, when `round_in_stage >= ROUNDS_PER_STAGE` triggers a stage advance (line 281), push a `StageSnap` for the hero with `lobby_avg = mean(strength for alive non-hero)`. Also snap once at the end. Return `snaps` alongside placement; `simulate_action` appends per rollout. **Cost is zero extra rollouts** — same loop, ~6 dict appends per game.

**New aggregator** in `evaluator.py`, `project_line(sim, hero_in) -> List[StageProjection]`. For each stage `s` in `hero_in.stage..FINAL_STAGE`, gather snaps at `s` across rollouts:

```python
@dataclass
class StageProjection:
    stage: int
    survival: float          # frac of rollouts hero alive entering this stage
    exp_hp: float            # mean hp over surviving rollouts
    strength_vs_lobby: float # mean(hero_strength / lobby_avg) -> 1.0 == parity
    exp_placement: float     # mean placement_so_far over those eliminated by now, blended
```

`exp_placement` per stage = mean over rollouts of (final placement conditioned on the rollout's trajectory through stage `s`); simplest cheap version: mean of `placement` for rollouts whose hero was eliminated at-or-before `s`, blended with current `exp_placement` for survivors using survival weight.

**New endpoint** `POST /api/project` (main.py). Reuses the **same seed + n_rollouts** as `/api/compare` so the projected line matches the displayed best line. Request/response models in `models.py`:

```python
class ProjectRequest(BaseModel):
    state: GameState
    line_key: Optional[str] = None        # default = best_key
    actions: Optional[List[ActionInput]] = None  # for what-if
    n_rollouts: int = Field(2000, ge=200, le=8000)

class StageProjectionModel(BaseModel):
    stage: int
    survival: float
    exp_hp: float
    strength_vs_lobby: float
    exp_placement: float

class ProjectResponse(BaseModel):
    state: GameState
    line_key: str
    line_label: str
    trajectory: List[StageProjectionModel]
    watch_next: str          # "what to look for next stage" text
    final_placement: float
    top4_rate: float
    cached: bool
```

Handler: build candidate actions (or custom for what-if), run `compare_actions` to pick `line_key` (default `best_key`), then re-run `simulate_action` for that one plan capturing snaps, call `project_line`. Cache by `cache.key({state, line_key, n_rollouts})`. `watch_next` is generated from the first stage where `survival` drops > 8% or `strength_vs_lobby` crosses below 0.95 (e.g. "Stage 4: lobby out-scales you — you need a strength spike or you bleed to ~62 HP").

## 2) Coach UI — "Plan" view

Add a `lib/api.ts` `project(state, lineKey?, actions?)` wrapper. In **CoachPanel.tsx**, add a `seg` tab toggle `Read | Plan` (gated: Plan only renders when `cfg.coachTree` i.e. Pro, since it's lookahead-heavy; Standard sees it read-only without what-if). On Plan tab, lazy-fetch `/api/project` for `data.best_key`:

- **Trajectory table** (existing classes): rows = `trajectory`, columns Stage / HP / Place / Surv%. Use `num` for values, `chip` per row colored by `survival` (>0.7 brand, 0.4–0.7 amber, <0.4 red).
- **Sparkline**: inline `<svg>` 120×28, polyline of `exp_hp` per stage (brand stroke) + a second faint line for `strength_vs_lobby*50`. No deps.
- **watch_next** rendered as the existing amber nudge `💡 {watch_next}`.
- **What-if** (`cfg.coachTree` only): a `seg` of the other `data.results.slice(1)` line labels; clicking calls `project(state, altKey)` and overlays a second dashed polyline + a delta row "alt: place 4.2 (−0.3)".

Component split: keep CoachPanel as host; add `components/solver/PlanView.tsx` (table + sparkline + what-if), `components/solver/Sparkline.tsx`.

## 3) In-game per-turn verdicts — "look back"

Reuse `review_mod._grade_one` on the **single** decision just locked. No new backend grading logic; expose `POST /api/review` already accepts a `decisions` list — call it with a **one-element list**, `n_rollouts: 600`.

**Storage on Game** (types.ts): extend `DecisionRecord` with optional grade:

```ts
export interface DecisionRecord {
  id: number; stageRound: string; pre: SolverState;
  actionKey: string; actionLabel: string;
  grade?: MoveGrade;        // filled async after the fight
}
```

`MoveGrade` mirrors the backend model (label_name, label_color, quality, best_label, gap_place, loss). `recordDecision` (engine.ts:354) already pushes the record at lock; **trigger grading async after `lockAndResolve`** in `play/page.tsx`: after the fight animation resolves, fire `review([lastDecision], 600)`, then write `grade` back into `game.decisions[id]` via a state setter (immutable update). Show a transient **verdict chip** in `StatusBar` for ~4s: `chip` styled with `style={{borderColor: grade.label_color}}` + `{grade.label_name}` + one-line why (`{grade.best_label === played ? "Best line." : `Better: ${grade.best_label}`}`). Gated: Beginner shows label only; Standard+ shows the why line.

**History panel/drawer**: new `components/play/History.tsx` as a tab in the right rail (alongside Coach) or a slide-over (`btn-ghost` "History" toggles a fixed drawer). Lists `game.decisions` newest-first: each row `chip` colored by `label_color`, `{stageRound}` + `{actionLabel}` + `{quality}`. Clicking a row sets `selectedDecisionPre` and re-runs `compare(decision.pre, 1200)` in the Coach Read view (re-open the solver read for that spot) — reuse existing CoachPanel by passing an override `state`.

## 4) Performance

- **Never block the round.** Grading is fired after fight resolution, not before lock; UI renders the chip when the promise resolves (optimistic "grading…" `chip` placeholder).
- **Cheap rollouts**: verdicts at `n_rollouts=600`; projection at 2000 (reuses one plan, ~6 snaps/game). Both well under the existing 1200 coach budget.
- **Cache by state**: backend `cache.key` already keys on the full request dict; identical revisited spots (History re-open, repeated what-if) are free. Frontend memoizes grades on `DecisionRecord.grade` so re-opening History never re-fetches.
- **Single-flight**: in CoachPanel/PlanView, abort/ignore stale fetches by comparing `roundKey`/`line_key` on resolve (same `JSON.stringify(state)` dep guard already used at line 36).

**Files touched:** `backend/app/solver/rollout.py`, `evaluator.py`, `models.py`, `main.py` (+`/api/project`); `frontend/lib/api.ts`, `lib/game/types.ts`, `lib/game/engine.ts`, `app/play/page.tsx`, `components/play/CoachPanel.tsx`, new `components/solver/PlanView.tsx`, `Sparkline.tsx`, `components/play/History.tsx`, chip wiring in `StatusBar.tsx`.

## SPEC: info_and_clarity

I have everything I need. Writing the spec.

---

# TASK D — Information-Rich Board + Clarity

All numbers below reuse existing symbols from `config.ts`, `data.ts`, `strength.ts`, `engine.ts`. No new game math is invented — every readout derives from functions that already exist.

## 0) Data layer — extend `data.ts` (original copy)

Add two blurb maps + lookup helpers, keyed by existing `ROSTER`/`TRAITS` keys:

```ts
// data.ts (append)
export const UNIT_WANTS: Record<string, string> = {
  emberkit: "Cheap Pyre opener. Wants early levels, not items — sell into 2-stars.",
  sparrowtail: "Backline Marksman carry. Wants 2-3 offensive modules and a back corner.",
  glimmerfin: "Tide Mystic that scales with stars. Wants a Lifewell and a safe flank.",
  // …one short line per all 23 keys (carry=item priority, frontline=positioning, flex=trait-fill)
};
export const TRAIT_WANTS: Record<string, string> = {
  pyre: "Aggressive damage origin. Big jump at 4 — hold pairs toward it.",
  warden: "Frontline wall. 4 Wardens lets squishy carries survive the back line.",
  drift: "Late origin; only worth it at 3+. Don't splash 1.",
  // …one line per all 9 trait keys
};
export function unitWants(k: string) { return UNIT_WANTS[k] ?? ""; }
export function traitWants(k: string) { return TRAIT_WANTS[k] ?? ""; }
export const ITEM_BEST_ON: Record<string, string> = {
  razorline: "Marksman / carry units (Sparrowtail, Quillark, Graveltongue).",
  aegishide: "Front-line Wardens (Tallow, Saltcrown, Deeproot).",
  // …one line per all 8 MODULES keys
};
export function itemBestOn(k: string) { return ITEM_BEST_ON[k] ?? "Any flex unit."; }
```

---

## 1) `UnitInspector.tsx` (new) — popover for any unit

Signature:
```ts
export default function UnitInspector({
  unit, anchor, hero, cfg, onClose,
}: { unit: FieldUnit; anchor: DOMRect; hero: Hero; cfg: LearnConfig; onClose: () => void });
```
Renders a fixed-position `.card` popover (≤280px) anchored to `anchor`, dismissed on outside-click/Esc. Fields, top to bottom:

- **Header:** `unit.name`, `"★".repeat(unit.star)`, ring color `TIER_COLORS[unit.tier]`, `chip` showing `Tier {I..V}` and `· {TIER_COST[unit.tier]}g` and role (`unit.role`).
- **Traits row:** each `unit.traits[k]` as a `chip`; if that trait is currently active on the board (look up `fieldedTraitCounts(hero.board)[k]` vs `activeBreakpoint(k,count)`), render with `border-brand/40 text-brand` and append `({count}/{nextBp})`.
- **Items:** for each `unit.items[i]` show `MODULES_BY_KEY[m].name`, `itemClass` dot (reuse UnitCard's color map), `+{strength}` `num`, and `itemBestOn(m)`. Empty slots show `□` up to `ITEM_SLOTS_PER_UNIT` (3).
- **Strength contribution:** `num` value = `unitStrength(unit)` (import from `strength.ts`); show base `TIER_BASE[tier]×STAR_MULT[star]` + item sum, e.g. `"24 base · +18 items = 42"`. **Pro only** shows the breakdown; beginner/standard show just the single number with label "Power".
- **"What this unit wants":** plain-English `unitWants(unit.key)`. Always shown (this is the clarity payload).
- Gating: `cfg.showItems===false` hides the items block; `cfg.learnTier!=="pro"` hides the breakdown math.

Wire-in: `UnitCard` gets `onInspect?: (rect: DOMRect) => void`; on hover (desktop) or long-press/right-click it calls `onInspect(e.currentTarget.getBoundingClientRect())`. `Board`, `Bench`, `Shop` lift this to a single `inspect` state in `play/page.tsx` (`{unit, anchor}|null`) and render one `<UnitInspector/>`. Shop units are wrapped into a transient `FieldUnit` via `ROSTER_BY_KEY[key]` (star 1, no items).

---

## 2) Trait panel — extend `activeTraits()` (engine.ts)

Add the active bonus and the "one more for X" delta to `ActiveTrait`:
```ts
export interface ActiveTrait {
  key; name; count; activeBp; nextBp; kind;
  activeBonus: number;     // traitBonus(key, count)
  nextBonus: number | null;// traitBonus(key, nextBp) if nextBp
  toNext: number | null;   // nextBp - count
}
```
Populate using existing `traitBonus`. New `TraitPanel.tsx`:
- Each row: trait name, `count`, segmented breakpoint pips (one filled per met breakpoint from `def.breakpoints`), `+{activeBonus}` `num` when `activeBp>0` (else dimmed).
- Nudge sub-line when `toNext===1`: `"1 more for +{nextBonus} {name}"` in `text-amber-200/90`. `toNext===2` shown only at standard/pro.
- Sort by active first (existing sort). `cfg.showTraitDetail` still gates the whole panel; replaces the inline strip at `page.tsx:121-135`.

---

## 3) Item info — `ItemTooltip.tsx` (new, tiny)

Hover tooltip over any item dot (UnitCard, item bank). Fields from `MODULES_BY_KEY[m]`: `name`, `itemClass` (capitalized), `+{strength}` `num`, and `itemBestOn(m)`. Pure presentational, no game state. Reused inside `UnitInspector` item rows.

---

## 4) Explicit XP/Level readout — `StatusBar.tsx`

Replace the bare Level bar (lines 41-48). Below the existing bar add `num` text:
- `{h.xp} / {xpNeed} XP to level {h.level+1}` (`xpNeed = XP_TO_NEXT[h.level]`).
- Buy-XP cost line: `"Buy XP: {XP_BUY_COST}g → +{XP_BUY_AMOUNT} XP"`.
- `"Passive +{XP_PASSIVE}/round"`.
- At `h.level===MAX_LEVEL` show `"Max level"`.
Gating: beginner sees only the bar + "to level N"; standard adds the buy-cost; pro adds passive line. Use existing `.num`, `text-[10px] text-slate-500`.

---

## 5) Explicit gold/interest readout — `StatusBar.tsx`

Augment the Gold block (lines 25-40). Keep dots; add `num` sub-lines:
- `intr = interest(h.gold)` → `"Interest +{intr}"`.
- `g2n = goldToNextInterest(h.gold)` → if `>0 && h.gold<50`: `"+1 at {h.gold+g2n}g ({g2n} more)"`; if `h.gold>=50`: `"Interest capped (+{INTEREST_CAP})"` — note cap reads `INTEREST_CAP`, and `50` is `INTEREST_CAP*INTEREST_PER`, computed not hardcoded.
- Projected (standard/pro): `"Next round: +{BASE_INCOME}+{intr}+{streakBonus(h.streak)} = {BASE_INCOME+intr+streakBonus(h.streak)}g"`.
Import `BASE_INCOME, INTEREST_CAP, INTEREST_PER, streakBonus`.

---

## 6) "What to do now" one-liner — `NextStep.tsx` (new)

Single high-contrast line rendered above the Board (`card px-3 py-2`, `✦` brand badge). Pure function combining the coach's `best` line with econ:
```ts
export function nextStep(best: LineResult | null, hero: Hero, cfg: LearnConfig): string;
```
Priority ladder (first true wins):
1. `hero.hp < 35` → `"Health low — add board power now (buy/upgrade, don't save)."`
2. coach `best.key` maps to a verb: `roll*`→`"Roll for upgrades — best line is {best.label}."`, `level*`→`"Buy XP to level {hero.level+1} ({XP_BUY_COST}g)."`, `econ`/save→`"Hold gold for interest — +1 at {hero.gold+goldToNextInterest(hero.gold)}g."`
3. fallback `goldToNextInterest`/cap nudge (reuse CoachPanel's `nudge` logic).
Beginner: always exactly one sentence, imperative, no metrics. Standard appends `top4 %`. Pro appends `EV {best.ev_score}`. `CoachPanel`'s inline `nudge` is removed and centralized here so guidance lives in one place.

---

## 7) Layout / progressive disclosure

- Left column order in `page.tsx`: StatusBar → **NextStep** (always) → OpponentsRail → TraitPanel (`showTraitDetail`) → Board → selection bar.
- One global inspect popover; one global item tooltip — no nested portals.
- Disclosure driven entirely by existing `LearnConfig` flags (`showItems`, `showTraitDetail`, `learnTier`): beginner sees NextStep + plain numbers; standard adds traits/items/projections; pro adds strength breakdowns + EV. No new settings.

**New files:** `frontend/components/play/{UnitInspector,TraitPanel,ItemTooltip,NextStep}.tsx`.
**Edited:** `data.ts` (+blurbs/helpers), `engine.ts` (`ActiveTrait` fields), `StatusBar.tsx`, `UnitCard.tsx` (+`onInspect`), `Board/Bench/Shop.tsx` (lift inspect), `CoachPanel.tsx` (drop inline nudge), `play/page.tsx` (compose). All CSS via existing `card btn-primary chip seg label num` classes.

## SPEC: chat_coach_llm

I have everything I need. Here is the implementation-ready spec.

---

# TASK E — LLM Chat-Coach (`/api/coach/chat`)

## 1) Backend endpoint — `POST /api/coach/chat`

**New file `backend/app/chat.py`** + handler wired into `main.py`. Activate only when `ANTHROPIC_API_KEY` is set.

### Request/response shapes (add to `models.py`)

```python
# models.py — append
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class CoachChatRequest(BaseModel):
    state: GameState                               # solverMap.toSolverState(game)
    compare: Optional[CompareResponse] = None      # the latest /api/compare result — GROUNDING
    log: List[ReviewDecision] = []                 # recent decisions (reuse existing model), cap 12
    history: List[ChatTurn] = Field(default_factory=list)  # prior chat, cap 8 turns client-side
    message: str = Field(..., min_length=1, max_length=2000)
    tier: Literal["beginner", "standard", "pro"] = "standard"
```

The response is a **streamed `text/event-stream`** (no Pydantic body). Add a capability flag to `/api/health`: `"chat_coach": bool(os.environ.get("ANTHROPIC_API_KEY"))` so the frontend can gate the UI.

### Handler skeleton (`backend/app/chat.py`)

```python
import os, json, time
from collections import defaultdict
import anthropic
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from .models import CoachChatRequest

router = APIRouter()
CHAT_ENABLED = bool(os.environ.get("ANTHROPIC_API_KEY"))
_client = anthropic.Anthropic() if CHAT_ENABLED else None   # reads ANTHROPIC_API_KEY
MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = """..."""   # see §1 system prompt below

# polite per-process rate limit: 1 req / 3s, 20 / 5min, keyed by client id header
_hits: dict[str, list[float]] = defaultdict(list)
def _allow(cid: str) -> bool:
    now = time.time(); xs = [t for t in _hits[cid] if now - t < 300]
    _hits[cid] = xs
    if xs and now - xs[-1] < 3.0: return False
    if len(xs) >= 20: return False
    xs.append(now); return True

def _grounding(req: CoachChatRequest) -> str:
    """Compact, deterministic context block from solver state + EV lines + log."""
    s = req.state
    lines = []
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
        f"{chr(10).join(lines)}\nBest line key: {best}\nProjection: {proj}\n\n"
        f"## Recent decisions\n{log}\n\n"
        f"## Player tier: {req.tier}"
    )

@router.post("/api/coach/chat")
def coach_chat(req: CoachChatRequest):
    if not CHAT_ENABLED:
        raise HTTPException(503, "Chat coach disabled (ANTHROPIC_API_KEY not set)")
    if not _allow("local"):
        raise HTTPException(429, "Slow down — one question every few seconds.")

    messages = [{"role": t.role, "content": t.content} for t in req.history[-8:]]
    # inject grounding as a mid-conversation system message (beta, supported on opus-4-8)
    # so it carries operator authority and doesn't get spoofed by the user turn:
    messages.append({"role": "system", "content": _grounding(req)})
    messages.append({"role": "user", "content": req.message})

    def gen():
        try:
            with _client.beta.messages.stream(
                model=MODEL,
                max_tokens=1024,
                thinking={"type": "adaptive"},
                system=[{"type": "text", "text": SYSTEM_PROMPT,
                         "cache_control": {"type": "ephemeral"}}],  # cache the frozen persona
                messages=messages,
                extra_headers={"anthropic-beta": "mid-conversation-system-2026-04-07"},
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'t': text})}\n\n"
            yield "data: {\"done\": true}\n\n"
        except anthropic.APIError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

Wire in `main.py`: `from .chat import router as chat_router` then `app.include_router(chat_router)`.

### System prompt text

```
You are the LineLab Coach — a sharp, concise macro-strategy coach for "The Arena", an
ORIGINAL auto-battler. You help one player make the right save/level/roll, stabilize-vs-cap,
and top-4-vs-first decisions.

GROUNDING: A mid-conversation system message gives you the current spot, the EV engine's
ranked lines (expected placement, top-4 rate, first rate, ev score, explanation), the best
line, and the player's recent decisions. These numbers come from a Monte Carlo solver that
simulates the whole game to the end. Treat them as ground truth. When you give advice, cite
the relevant line and its numbers ("Rolling here lands 58% top-4 vs 49% if you save"). If the
user's instinct disagrees with the EV table, explain the gap using the numbers, don't hand-wave.
If no compare data is present, reason qualitatively and say so.

DOMAIN: Stay in auto-battler macro. Vocabulary is generic and original: origins (Pyre, Tide,
Storm, Drift, Forge), roles (Marksman, Warden, Mystic, Skirmisher), "stat module" items, gold
interest, streaks, level/XP costs, shop odds. NEVER invent or reference real champion, item, or
trait names from any other game — this is our own IP. If asked about a real product, decline and
redirect to The Arena.

STYLE: Be brief — 2-4 sentences for most answers, a short list at most. Lead with the call,
then the reason. Match the player tier: "beginner" = focus on gold/health/the big three moves,
avoid jargon; "standard" = tempo and roll timing; "pro" = full EV reasoning, exact numbers,
branch lines. Never fabricate numbers the grounding didn't give you.
```

## 2) Grounding strategy

The model never recomputes EV — it **reads** it. On each chat send, the frontend passes the *current* `CompareResponse` (already cached in `CoachPanel`'s `data`) plus `toSolverState(game)` and the recent decision log. `_grounding()` flattens the ranked lines, explanations, `best_key`, and `summary` (projected trajectory) into a deterministic block, injected as a `role:"system"` message (operator-authority, prompt-injection-safe, and it sits *after* the cached persona prefix so the frozen `SYSTEM_PROMPT` stays cache-hittable). The persona explicitly instructs the model to defer to those numbers and cite them, keeping chat answers consistent with the live `Best line` card.

## 3) OPTIONAL tool-use upgrade — phase 2

Give the model a `simulate_line` tool so it can answer "what if I roll to 10?" by calling the actual EV engine on a hypothetical state. Schema:

```python
SIM_TOOL = {
  "name": "simulate_line",
  "description": "Run the EV solver on a hypothetical state to compare lines. "
                 "Call this when the user asks 'what if' about a state different from the current spot.",
  "input_schema": {"type": "object", "properties": {
    "state": {"type": "object", "description": "GameState overrides (stage,hp,gold,level,...)"},
    "actions": {"type": "array", "items": {"type": "object"}, "description": "optional custom lines"}
  }, "required": ["state"]}}
```

Manual tool loop (per Anthropic pattern): drop streaming for the tool turn, call `_client.messages.create(..., tools=[SIM_TOOL])`; while `stop_reason == "tool_use"`, execute via the existing `compare_actions(StateInput(**merged), ...)` from `solver/`, append the `tool_result`, loop. Once `end_turn`, switch back to `messages.stream` for the final answer. Mark phase 2 — the §1 grounding covers the common case without a round-trip.

## 4) Frontend chat UI — extend `CoachPanel.tsx`

Add a collapsible chat section below the existing Best-line card, gated `cfg.coachMetrics` (standard+; hide entirely for beginner) and on a `chatEnabled` flag read once from `/api/health`.

- **State:** `const [msgs, setMsgs] = useState<ChatTurn[]>([])`, `input`, `streaming`.
- **`lib/api.ts` — `coachChat()`:** `fetch(${API_URL}/api/coach/chat, {method:POST, body: JSON.stringify({state, compare: data, log, history: msgs, message, tier})})`, then read `res.body.getReader()`, split on `\n\n`, parse `data:` JSON, append `t` deltas to the last assistant message (streaming render). On `{error}` show an inline error chip; on network failure show "Coach offline".
- **Message list:** map `msgs` to bubbles — user right-aligned `chip`, assistant `rounded-lg border border-ink-700 p-2 text-xs`.
- **Input row:** `<input className="...">` + `btn-primary` send; disabled while `streaming`.
- **Suggested-question chips** (render when `msgs.length===0`): "Should I roll?", "Why is my board weak?", "What does Pyre want?" as `chip` buttons that prefill+send.
- **Disabled state:** if `!chatEnabled`, render a muted `card` note: "Chat coach is off — set ANTHROPIC_API_KEY on the backend to enable." Reuse the existing `data` (current `CompareResponse`) as the `compare` payload so answers match the Best-line card the user sees.

## 5) Cost / safety

User's own key, read server-side from `ANTHROPIC_API_KEY` — **never** sent to the browser; the frontend only sees the boolean health flag. Bound context: `max_tokens: 1024`, history capped to 8 turns and log to 12 entries client-side and server-side, `message` capped at 2000 chars (Pydantic). Cache the frozen `SYSTEM_PROMPT` via `cache_control` so repeated chats pay ~0.1× on the persona prefix. Polite rate limit (`_allow`, 1/3s, 20/5min) returns 429. Opus 4.8 may return `stop_reason:"refusal"` on off-domain prompts — the persona's redirect handles most, but the stream just ends cleanly if so.

**Files:** `backend/app/chat.py` (new), `backend/app/models.py` (+`ChatTurn`,`CoachChatRequest`), `backend/app/main.py` (router + health flag), `frontend/lib/api.ts` (+`coachChat` SSE reader, `chatEnabled` from health), `frontend/components/play/CoachPanel.tsx` (chat section).