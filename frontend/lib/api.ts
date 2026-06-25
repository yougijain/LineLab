// Thin client for the LineLab Solver API, with a graceful offline fallback.

import type {
  ChatTurn,
  CompareResponse,
  GameState,
  HealthInfo,
  ProjectResponse,
  ReviewDecisionInput,
  ReviewResponse,
  Scenario,
} from "./types";
import { SAMPLE_RESULT } from "./sampleResult";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(`${res.status} ${res.statusText} ${body}`.trim());
  }
  return (await res.json()) as T;
}

export interface CompareOutcome {
  data: CompareResponse;
  offline: boolean; // true => the embedded sample was used (API unreachable)
}

export async function compare(
  state: GameState,
  nRollouts: number,
): Promise<CompareOutcome> {
  try {
    const data = await req<CompareResponse>("/api/compare", {
      method: "POST",
      body: JSON.stringify({ state, n_rollouts: nRollouts }),
    });
    return { data, offline: false };
  } catch (err) {
    // Fall back to the embedded sample so the UI stays meaningful offline.
    return { data: { ...SAMPLE_RESULT, state }, offline: true };
  }
}

export async function getHealth(): Promise<HealthInfo | null> {
  try {
    return await req<HealthInfo>("/api/health");
  } catch {
    return null;
  }
}

export async function project(
  state: GameState,
  lineKey?: string,
  nRollouts = 2000,
): Promise<ProjectResponse | null> {
  try {
    return await req<ProjectResponse>("/api/project", {
      method: "POST",
      body: JSON.stringify({ state, line_key: lineKey ?? null, n_rollouts: nRollouts }),
    });
  } catch {
    return null;
  }
}

/** Stream the chat-coach reply. Calls onDelta with each text chunk; resolves on done. */
export async function coachChat(
  body: {
    state: GameState;
    compare: CompareResponse | null;
    log: ReviewDecisionInput[];
    history: ChatTurn[];
    message: string;
    tier: string;
  },
  onDelta: (text: string) => void,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/coach/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      return { ok: false, error: res.status === 503 ? "Chat coach is off (no API key)." : `HTTP ${res.status}` };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        try {
          const obj = JSON.parse(line.slice(5).trim());
          if (obj.t) onDelta(obj.t);
          if (obj.error) return { ok: false, error: obj.error };
        } catch {
          /* ignore partial */
        }
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Coach offline." };
  }
}

export async function reviewGame(
  decisions: ReviewDecisionInput[],
  nRollouts = 700,
): Promise<ReviewResponse | null> {
  try {
    return await req<ReviewResponse>("/api/review", {
      method: "POST",
      body: JSON.stringify({ decisions, n_rollouts: nRollouts }),
    });
  } catch {
    return null;
  }
}

export async function getScenarios(): Promise<Scenario[]> {
  try {
    return await req<Scenario[]>("/api/scenarios");
  } catch {
    return [];
  }
}

export async function saveScenario(
  name: string,
  description: string,
  state: GameState,
): Promise<Scenario | null> {
  try {
    return await req<Scenario>("/api/scenarios", {
      method: "POST",
      body: JSON.stringify({ name, description, state }),
    });
  } catch {
    return null;
  }
}

export async function deleteScenario(id: string): Promise<boolean> {
  try {
    await req(`/api/scenarios/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}
