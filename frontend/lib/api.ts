// Thin client for the LineLab Solver API, with a graceful offline fallback.

import type { CompareResponse, GameState, Scenario } from "./types";
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
