"use client";

import { useRef, useState } from "react";
import { coachChat } from "@/lib/api";
import type { ChatTurn, CompareResponse, GameState, ReviewDecisionInput } from "@/lib/types";

const SUGGESTIONS = ["Should I roll here?", "Why is my board weak?", "What does Pyre want?"];

export default function ChatBox({
  enabled,
  state,
  compare,
  log,
  tier,
}: {
  enabled: boolean;
  state: GameState;
  compare: CompareResponse | null;
  log: ReviewDecisionInput[];
  tier: string;
}) {
  const [msgs, setMsgs] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  if (!enabled) {
    return (
      <div className="mt-3 rounded-lg border border-ink-700 bg-ink-950/40 p-3 text-xs text-slate-500">
        Chat coach is off — set <code className="num">ANTHROPIC_API_KEY</code> on the backend to ask
        the coach questions.
      </div>
    );
  }

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const history = msgs.slice(-8);
    setMsgs((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    const res = await coachChat(
      { state, compare, log, history, message: text, tier },
      (delta) => {
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + delta,
          };
          return copy;
        });
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
      },
    );
    if (!res.ok) {
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: `⚠ ${res.error ?? "Coach offline."}` };
        return copy;
      });
    }
    setStreaming(false);
  };

  return (
    <div className="mt-3 border-t border-ink-700 pt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="label">Ask the coach</span>
      </div>

      {msgs.length === 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip hover:border-brand/40 hover:text-brand">
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div ref={scroller} className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <span className="rounded-lg bg-brand/15 px-2.5 py-1 text-xs text-brand">{m.content}</span>
              </div>
            ) : (
              <div key={i} className="rounded-lg border border-ink-700 p-2 text-xs leading-relaxed text-slate-200">
                {m.content || <span className="text-slate-500">…</span>}
              </div>
            ),
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this spot…"
          disabled={streaming}
          className="flex-1 rounded-lg border border-ink-700 bg-ink-950/50 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600"
        />
        <button type="submit" disabled={streaming || !input.trim()} className="btn-primary px-3 py-1.5 text-xs">
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
