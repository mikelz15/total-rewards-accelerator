import { createHash } from "node:crypto";
import { DEFAULT_PRICE, MODEL_PRICES } from "./config";

/**
 * Ask TRA guardrails — pure functions, unit-tested in web/tests/ask-tra.
 *
 * Two layers protect the chat:
 *  1. This deterministic pre-flight check runs BEFORE the model is called.
 *     If a visitor pastes what looks like real employee/candidate data, the
 *     request never reaches the model and nothing is echoed back.
 *  2. The system prompt (prompt.ts) instructs the model to refuse anything
 *     that slips through and to never repeat personal data.
 */

export interface SensitiveHit {
  kind: string;
  detail: string;
}

const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
const DOB_RE =
  /\b(date of birth|dob|birthdate)\b[^0-9]{0,6}\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/i;
const SSN_WORD_RE = /\b(social security|ssn)\b/i;
const CURRENCY_RE = /\$\s?\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\$\s?\d{4,}(?:\.\d{2})?/;
const NAME_PAIR_RE =
  /\b[A-Z][a-z]{1,20}\s+(?:[A-Z]\.\s+)?[A-Z][a-z]{1,20}\b/;
const DATA_HEADER_RE =
  /\b(employee|candidate|worker)\s*(id|name|#)\b|\b(salary|base pay|annual pay)\b.*\b(midpoint|range|hire date)\b/i;

/** Luhn check so ordinary long numbers (years, counts) don't false-positive. */
function looksLikeCardNumber(text: string): boolean {
  const candidates = text.match(/\b(?:\d[ -]?){13,19}\b/g) || [];
  for (const raw of candidates) {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length < 13 || digits.length > 19) continue;
    let sum = 0;
    let dbl = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (dbl) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      dbl = !dbl;
    }
    if (sum % 10 === 0) return true;
  }
  return false;
}

/**
 * Returns a hit when the text looks like real personal / employee data.
 * Deliberately conservative: a single salary figure for a hypothetical offer
 * (normal Closer talk) does NOT trip this — bulk rows, identifier+pay pairings,
 * and hard identifiers (SSN, card numbers, labelled DOB) do.
 */
export function detectSensitiveData(text: string): SensitiveHit | null {
  if (SSN_RE.test(text)) {
    return { kind: "ssn", detail: "Looks like a Social Security number." };
  }
  if (SSN_WORD_RE.test(text) && /\d/.test(text)) {
    return { kind: "ssn", detail: "Mentions a Social Security number." };
  }
  if (looksLikeCardNumber(text)) {
    return { kind: "card", detail: "Looks like a payment card number." };
  }
  if (DOB_RE.test(text)) {
    return { kind: "dob", detail: "Includes a labelled date of birth." };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Bulk data: several lines that each carry a money figure read as pasted rows.
  const moneyLines = lines.filter((l) => CURRENCY_RE.test(l));
  if (moneyLines.length >= 4) {
    return {
      kind: "bulk-pay-data",
      detail: `${moneyLines.length} lines carry pay figures — that reads as pasted employee data.`,
    };
  }

  // CSV-shaped dump: many comma rows, especially with HR headers.
  const csvLines = lines.filter((l) => (l.match(/,/g) || []).length >= 4);
  if (csvLines.length >= 5 || (csvLines.length >= 3 && DATA_HEADER_RE.test(text))) {
    return { kind: "bulk-rows", detail: "Looks like pasted spreadsheet rows." };
  }
  if (DATA_HEADER_RE.test(text) && moneyLines.length >= 1) {
    return { kind: "bulk-rows", detail: "HR column headers plus pay figures." };
  }

  // A person's name on the same line as their pay, on more than one line —
  // one hypothetical ("Jane Smith at $120k") can be a sample question, a list
  // of them is real data.
  const namePayLines = moneyLines.filter((l) => NAME_PAIR_RE.test(l));
  if (namePayLines.length >= 2) {
    return {
      kind: "named-pay",
      detail: "Multiple names paired with pay figures.",
    };
  }

  return null;
}

/** The exact refusal copy. Never includes any of the visitor's text. */
export const SENSITIVE_REFUSAL =
  "Stop there — that looks like real employee or candidate data, and I can't take it in. " +
  "Please don't paste real people's information into this chat or the public demo. " +
  "If you want to see how the tools work, the demo runs on a built-in sample file with fictional people. " +
  "If you were asking a general question, rephrase it without names or anyone's pay and I'll answer it.";

/** Rough USD estimate for one answered question, from token usage. */
export function estimateCostUsd(
  model: string,
  usage: { inputTokens?: number; outputTokens?: number } | undefined
): number {
  const price = MODEL_PRICES[model] || DEFAULT_PRICE;
  const input = usage?.inputTokens ?? 0;
  const output = usage?.outputTokens ?? 0;
  return (input / 1_000_000) * price.inputPerM + (output / 1_000_000) * price.outputPerM;
}

/** Privacy-preserving visitor key: raw IPs are never stored or logged. */
export function visitorKey(ip: string | null | undefined): string {
  return createHash("sha256").update(`ask-tra:${ip || "unknown"}`).digest("hex").slice(0, 32);
}
