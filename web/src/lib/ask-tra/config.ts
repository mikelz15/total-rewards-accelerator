/**
 * Ask TRA — central configuration.
 *
 * Everything here can be overridden by environment variables at deploy time.
 * Prices are NEVER part of this config: Ask TRA links to /pricing instead.
 */

export const ASK_TRA = {
  /**
   * Shiva's HQ inbox. Talk to Mike handoffs are addressed here (switched
   * from Rio 2026-10-29, Michael's approval): Shiva triages and drafts for
   * Mike's red pen. Rio and Michael are cc'd on every handoff (handoffCc),
   * so Rio keeps visibility without being a forwarding hop.
   */
  contactEmail: process.env.ASK_TRA_CONTACT_EMAIL || "shiva@send.totalrewardsaccelerator.com",

  /** Cc list for handoff + ops-alert email (comma-separated env override). */
  handoffCc: (process.env.ASK_TRA_HANDOFF_CC || "heyrio@mail.grokbot.com,mikez.lopez15@gmail.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  /**
   * Model served through the Vercel AI Gateway (string model IDs are routed
   * by the gateway). Default is a small, cheap model: at gateway list prices
   * (~$0.15 / 1M input, $0.60 / 1M output) and ~2,500 input + ~350 output
   * tokens per answered question, one question costs roughly $0.0006, so the
   * $25 cap covers well over 12,500 questions/month.
   */
  model: process.env.ASK_TRA_MODEL || "openai/gpt-4o-mini",

  /** Monthly budget guard (USD, estimated from token usage). */
  budgetAlertUsd: Number(process.env.ASK_TRA_BUDGET_ALERT_USD || 20),
  budgetCapUsd: Number(process.env.ASK_TRA_BUDGET_CAP_USD || 25),

  /** Per-visitor rate limits (per hashed IP, in-memory — see ratelimit.ts). */
  chatPerWindow: 8,
  chatWindowMs: 10 * 60 * 1000,
  chatPerDay: 40,
  handoffPerDay: 3,

  /** Abuse / cost caps on a single chat request. */
  maxMessages: 10,
  maxMessageChars: 2000,
  maxTotalChars: 12000,
  maxOutputTokens: 600,
} as const;

/** Gateway list prices (USD per 1M tokens) used for the budget estimate. */
export const MODEL_PRICES: Record<string, { inputPerM: number; outputPerM: number }> = {
  "openai/gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
  "openai/gpt-4.1-mini": { inputPerM: 0.4, outputPerM: 1.6 },
  "anthropic/claude-haiku-4.5": { inputPerM: 1.0, outputPerM: 5.0 },
  "google/gemini-2.0-flash": { inputPerM: 0.1, outputPerM: 0.4 },
};

/** Fallback price assumption for an unlisted model (priced like gpt-4o-mini). */
export const DEFAULT_PRICE = { inputPerM: 0.15, outputPerM: 0.6 };
