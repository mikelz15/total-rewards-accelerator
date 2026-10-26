import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ASK_TRA } from "./config";

/**
 * Ask TRA usage / budget store + handoff queue.
 *
 * ANONYMOUS LOGGING RULE: this store only ever keeps aggregate counters —
 * questions answered, refusals, handoffs, token totals, estimated cost.
 * Chat content is never written here (or anywhere else).
 *
 * Production storage: Supabase (the stack this codebase already runs on),
 * tables from api/app/db/migrations/006_ask_tra.sql, accessed with the
 * service-role key so RLS keeps the tables invisible to the public API.
 * When SUPABASE_SERVICE_ROLE_KEY is not set (local dev), an in-memory store
 * is used instead — counters then reset on cold start and the budget cap is
 * best-effort per instance. That fallback is for development only.
 */

export interface MonthUsage {
  month: string; // YYYY-MM (UTC)
  questions: number;
  refusals: number;
  handoffs: number;
  inputTokens: number;
  outputTokens: number;
  estCostUsd: number;
}

export type BudgetStatus = "open" | "alert" | "paused";

export interface UsageDelta {
  questions?: number;
  refusals?: number;
  handoffs?: number;
  inputTokens?: number;
  outputTokens?: number;
  estCostUsd?: number;
}

export interface RecordResult {
  usage: MonthUsage;
  crossedAlert: boolean;
  crossedCap: boolean;
}

export function monthKey(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function budgetStatus(usage: MonthUsage): BudgetStatus {
  if (usage.estCostUsd >= ASK_TRA.budgetCapUsd) return "paused";
  if (usage.estCostUsd >= ASK_TRA.budgetAlertUsd) return "alert";
  return "open";
}

function emptyUsage(month: string): MonthUsage {
  return {
    month,
    questions: 0,
    refusals: 0,
    handoffs: 0,
    inputTokens: 0,
    outputTokens: 0,
    estCostUsd: 0,
  };
}

function applyDelta(usage: MonthUsage, delta: UsageDelta): MonthUsage {
  return {
    month: usage.month,
    questions: usage.questions + (delta.questions ?? 0),
    refusals: usage.refusals + (delta.refusals ?? 0),
    handoffs: usage.handoffs + (delta.handoffs ?? 0),
    inputTokens: usage.inputTokens + (delta.inputTokens ?? 0),
    outputTokens: usage.outputTokens + (delta.outputTokens ?? 0),
    estCostUsd: usage.estCostUsd + (delta.estCostUsd ?? 0),
  };
}

function crossings(before: MonthUsage, after: MonthUsage): Pick<RecordResult, "crossedAlert" | "crossedCap"> {
  return {
    crossedAlert: before.estCostUsd < ASK_TRA.budgetAlertUsd && after.estCostUsd >= ASK_TRA.budgetAlertUsd,
    crossedCap: before.estCostUsd < ASK_TRA.budgetCapUsd && after.estCostUsd >= ASK_TRA.budgetCapUsd,
  };
}

export interface AskTraStore {
  getUsage(month: string): Promise<MonthUsage>;
  record(month: string, delta: UsageDelta): Promise<RecordResult>;
  saveHandoff(h: { name: string; email: string; question: string }): Promise<{ id: string; stored: boolean }>;
}

/* ---------------- In-memory fallback (local dev only) ---------------- */

class MemoryStore implements AskTraStore {
  private months = new Map<string, MonthUsage>();
  private handoffQueue: Array<{ id: string; name: string; email: string; question: string }> = [];

  async getUsage(month: string): Promise<MonthUsage> {
    return this.months.get(month) ?? emptyUsage(month);
  }

  async record(month: string, delta: UsageDelta): Promise<RecordResult> {
    const before = await this.getUsage(month);
    const after = applyDelta(before, delta);
    this.months.set(month, after);
    return { usage: after, ...crossings(before, after) };
  }

  async saveHandoff(h: { name: string; email: string; question: string }) {
    const id = `mem-${this.handoffQueue.length + 1}`;
    this.handoffQueue.push({ id, ...h });
    return { id, stored: true };
  }
}

/* ---------------- Supabase (production) ---------------- */

class SupabaseStore implements AskTraStore {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getUsage(month: string): Promise<MonthUsage> {
    const { data, error } = await this.client
      .from("ask_tra_usage_monthly")
      .select("month, questions, refusals, handoffs, input_tokens, output_tokens, est_cost_usd")
      .eq("month", month)
      .maybeSingle();
    if (error || !data) return emptyUsage(month);
    return {
      month: data.month,
      questions: data.questions ?? 0,
      refusals: data.refusals ?? 0,
      handoffs: data.handoffs ?? 0,
      inputTokens: data.input_tokens ?? 0,
      outputTokens: data.output_tokens ?? 0,
      estCostUsd: Number(data.est_cost_usd ?? 0),
    };
  }

  async record(month: string, delta: UsageDelta): Promise<RecordResult> {
    const before = await this.getUsage(month);
    // Atomic increment lives in Postgres (migration 006) so concurrent
    // instances cannot lose counts or double-fire the alert crossing.
    const { error } = await this.client.rpc("ask_tra_add_usage", {
      p_month: month,
      p_questions: delta.questions ?? 0,
      p_refusals: delta.refusals ?? 0,
      p_handoffs: delta.handoffs ?? 0,
      p_input_tokens: delta.inputTokens ?? 0,
      p_output_tokens: delta.outputTokens ?? 0,
      p_est_cost_usd: delta.estCostUsd ?? 0,
    });
    if (error) {
      // Best effort: the chat must not fail because the meter did.
      console.error("[ask-tra] usage record failed:", error.message);
      const after = applyDelta(before, delta);
      return { usage: after, ...crossings(before, after) };
    }
    const after = await this.getUsage(month);
    return { usage: after, ...crossings(before, after) };
  }

  async saveHandoff(h: { name: string; email: string; question: string }) {
    const { data, error } = await this.client
      .from("ask_tra_handoffs")
      .insert({ name: h.name, email: h.email, question: h.question, delivered: false })
      .select("id")
      .single();
    if (error || !data) {
      if (error) console.error("[ask-tra] handoff store failed:", error.message);
      return { id: "", stored: false };
    }
    return { id: String(data.id), stored: true };
  }
}

/* ---------------- Selection ---------------- */

let cached: AskTraStore | null = null;

export function getStore(): AskTraStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    cached = new SupabaseStore(url, serviceKey);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[ask-tra] SUPABASE_SERVICE_ROLE_KEY not set — usage/budget counters are in-memory only. " +
          "The $25 cap is best-effort until the service key and migration 006 are in place."
      );
    }
    cached = new MemoryStore();
  }
  return cached;
}
