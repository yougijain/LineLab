"use client";

import { useEffect, useState } from "react";
import {
  applyOfferPick,
  buyUnit,
  buyXP,
  benchUnit,
  fieldUnit,
  lockAndResolve,
  newGame,
  refreshShop,
  refundValue,
  sellUnit,
  toSolverState,
} from "@/lib/game/engine";
import { LEARN_TIERS } from "@/lib/game/tiers";
import type { DecisionGrade, FieldUnit, Game, Settings } from "@/lib/game/types";
import type { CompareResponse, GameState, ReviewDecisionInput } from "@/lib/types";
import { getHealth, reviewGame } from "@/lib/api";
import SetupScreen from "@/components/play/SetupScreen";
import StatusBar from "@/components/play/StatusBar";
import OpponentsRail from "@/components/play/OpponentsRail";
import ThreatBoard from "@/components/play/ThreatBoard";
import ScoutDrawer from "@/components/play/ScoutDrawer";
import ScoutStrip from "@/components/play/ScoutStrip";
import OfferModal from "@/components/play/OfferModal";
import Board from "@/components/play/Board";
import Bench from "@/components/play/Bench";
import Shop from "@/components/play/Shop";
import CoachPanel from "@/components/play/CoachPanel";
import Review from "@/components/play/Review";
import ActiveTraits from "@/components/play/ActiveTraits";
import NextStep from "@/components/play/NextStep";
import UnitInspector from "@/components/play/UnitInspector";
import History from "@/components/play/History";

interface Inspect {
  unit: FieldUnit;
  anchor: DOMRect;
}

export default function PlayPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ won: boolean; opp: string; loss: number } | null>(null);
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [verdict, setVerdict] = useState<DecisionGrade | null>(null);
  const [coachData, setCoachData] = useState<CompareResponse | null>(null);
  const [scoutId, setScoutId] = useState<string | null>(null);
  const [chatEnabled, setChatEnabled] = useState(false);

  useEffect(() => {
    getHealth().then((h) => setChatEnabled(!!h?.chat_coach));
  }, []);

  if (!game) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">The Arena</h1>
        <p className="mt-1 text-sm text-slate-400">
          Play LineLab&rsquo;s original auto-battler with a live solver coach, then review
          every macro decision. No third-party game content.
        </p>
        <SetupScreen onStart={(s: Settings) => setGame(newGame(s))} />
      </div>
    );
  }

  const cfg = LEARN_TIERS[game.settings.learnTier];

  if (game.phase === "gameover") {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Line Review</h1>
        <p className="mt-1 text-sm text-slate-400">
          Every decision graded against the solver — original labels, Keystone to Misline.
        </p>
        <div className="mt-5">
          <Review
            decisions={game.decisions}
            placement={game.hero.placement}
            onPlayAgain={() => {
              setGame(null);
              setSel(null);
              setVerdict(null);
              setCoachData(null);
              setScoutId(null);
            }}
          />
        </div>
      </div>
    );
  }

  const selUnit =
    game.hero.board.find((u) => u.uid === sel) ?? game.hero.bench.find((u) => u.uid === sel);
  const best =
    coachData?.results.find((r) => r.key === coachData.best_key) ?? coachData?.results[0] ?? null;
  const fielded = game.hero.board.length;

  const apply = (next: Game) => setGame(next);

  const onCell = (cell: number) => {
    if (sel) {
      apply(fieldUnit(game, sel, cell));
      setSel(null);
    }
  };

  const onInspect = (unit: FieldUnit, anchor: DOMRect) => setInspect({ unit, anchor });

  const gradeLastDecision = (next: Game) => {
    const dec = next.decisions[next.decisions.length - 1];
    if (!dec) return;
    reviewGame(
      [{ state: dec.pre, action_key: dec.actionKey, action_label: dec.actionLabel, stage_round: dec.stageRound }],
      600,
    ).then((r) => {
      if (!r || !r.grades.length) return;
      const g = r.grades[0];
      const grade: DecisionGrade = {
        label_name: g.label_name,
        label_color: g.label_color,
        label_meaning: g.label_meaning,
        quality: g.quality,
        best_label: g.best_label,
        played_label: g.played_label,
        gap_place: g.gap_place,
      };
      setVerdict(grade);
      setTimeout(() => setVerdict((v) => (v === grade ? null : v)), 6000);
      setGame((prev) => {
        if (!prev) return prev;
        const clone = structuredClone(prev);
        const rec = clone.decisions.find((d) => d.id === dec.id);
        if (rec) rec.grade = grade;
        return clone;
      });
    });
  };

  const onLock = () => {
    if (busy) return;
    setBusy(true);
    setSel(null);
    const next = lockAndResolve(game);
    setTimeout(() => {
      setGame(next);
      setBusy(false);
      if (next.lastRound) {
        setBanner({ won: next.lastRound.won, opp: next.lastRound.opponentName, loss: next.lastRound.hpLoss });
        setTimeout(() => setBanner(null), 1600);
      }
      gradeLastDecision(next);
    }, 650);
  };

  return (
    <div className="py-5">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">The Arena</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="chip">Tier: {cfg.label}</span>
          <span className="chip">Bots: {game.settings.botDiff}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(String(game.seed))}
            className="chip num text-slate-400 hover:text-white"
            title="Copy seed — replay this exact run from Setup"
          >
            Seed {game.seed}
          </button>
          <button onClick={() => setHistoryOpen(true)} className="btn-ghost px-3 py-1 text-xs">
            History
          </button>
          <button onClick={() => { setGame(null); setSel(null); setScoutId(null); }} className="text-slate-400 hover:text-white">
            Quit
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <StatusBar game={game} cfg={cfg} verdict={verdict} />

          <NextStep best={best} hero={game.hero} cfg={cfg} />

          {cfg.label === "Beginner" ? (
            <ScoutStrip game={game} />
          ) : (
            <>
              <OpponentsRail
                bots={game.bots}
                nextOpponent={game.bots.find((b) => b.alive)?.id}
                onScout={setScoutId}
              />
              <ThreatBoard game={game} cfg={cfg} />
            </>
          )}

          <ActiveTraits hero={game.hero} cfg={cfg} />

          <div className="relative">
            {busy && <div className="animate-vsflash pointer-events-none absolute inset-0 z-10 rounded-xl bg-gradient-to-br from-brand/40 to-accent/40" />}
            {banner && (
              <div
                className={`absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                  banner.won ? "bg-brand text-ink-950" : "border border-red-500/40 bg-red-500/15 text-red-300"
                }`}
              >
                {banner.won ? `Won vs ${banner.opp}` : `Lost vs ${banner.opp} · −${banner.loss} HP`}
              </div>
            )}
            <div className="card p-3">
              <Board hero={game.hero} selectedUid={sel} onSelect={setSel} onCell={onCell} onInspect={onInspect} />
            </div>
          </div>

          {selUnit && (
            <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm">
              <span className="font-medium text-white">{selUnit.name}</span>
              <span className="num text-xs text-slate-400">{"★".repeat(selUnit.star)}</span>
              <div className="ml-auto flex gap-2">
                {selUnit.onBoard ? (
                  <button onClick={() => { apply(benchUnit(game, selUnit.uid)); setSel(null); }} className="btn-ghost px-3 py-1 text-xs">
                    To bench
                  </button>
                ) : (
                  <span className="self-center text-xs text-slate-500">
                    {fielded < game.hero.level ? "click a board cell to field" : "board full"}
                  </span>
                )}
                <button onClick={() => { apply(sellUnit(game, selUnit.uid)); setSel(null); }} className="btn-ghost px-3 py-1 text-xs text-red-300">
                  Sell {refundValue(selUnit)}g
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label">Bench</span>
              <span className="num text-xs text-slate-500">Board {fielded}/{game.hero.level}</span>
            </div>
            <Bench hero={game.hero} selectedUid={sel} onSelect={setSel} onInspect={onInspect} />
          </div>

          <Shop
            hero={game.hero}
            onBuy={(s) => apply(buyUnit(game, s))}
            onRefresh={() => apply(refreshShop(game))}
            onBuyXP={() => apply(buyXP(game))}
            onLock={onLock}
            busy={busy}
            showOdds={game.settings.learnTier === "pro"}
          />
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <CoachPanel
            state={toSolverState(game) as GameState}
            roundKey={game.roundNumber}
            cfg={cfg}
            onResult={setCoachData}
            log={
              game.decisions.slice(-8).map((d) => ({
                state: d.pre,
                action_key: d.actionKey,
                action_label: d.actionLabel,
                stage_round: d.stageRound,
              })) as unknown as ReviewDecisionInput[]
            }
            chatEnabled={chatEnabled}
          />
        </div>
      </div>

      {game.pendingOffer && game.pendingOffer.length > 0 && (
        <OfferModal
          offer={game.pendingOffer}
          onPick={(key) => setGame(applyOfferPick(game, key))}
          hint={
            cfg.label === "Beginner"
              ? "New here? Economy picks (gold / interest) are the safe default — they help any board."
              : undefined
          }
        />
      )}

      {scoutId &&
        (() => {
          const bot = game.bots.find((b) => b.id === scoutId);
          return bot ? (
            <ScoutDrawer bot={bot} hero={game.hero} cfg={cfg} onClose={() => setScoutId(null)} />
          ) : null;
        })()}

      {inspect && (
        <UnitInspector
          unit={inspect.unit}
          anchor={inspect.anchor}
          hero={game.hero}
          cfg={cfg}
          onClose={() => setInspect(null)}
        />
      )}

      {historyOpen && (
        <History decisions={game.decisions} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
}
