import { ASK_TRA } from "./config";

/**
 * Handoff delivery.
 *
 * When RESEND_API_KEY and ASK_TRA_FROM_EMAIL are configured (done
 * 2026-10-29), handoffs are emailed straight to Shiva's HQ inbox
 * (ASK_TRA.contactEmail), with Rio and Michael cc'd (ASK_TRA.handoffCc).
 * The caller stores every submission in the ask_tra_handoffs table as
 * the backup of record, marked delivered or unsent. Either way the
 * visitor also sees the direct email address in the UI.
 *
 * Handoff content is a message to the team (Shiva's inbox; Rio and
 * Michael cc'd). It is never written to the anonymous usage log.
 */

export interface Handoff {
  name: string;
  email: string;
  question: string;
}

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ASK_TRA_FROM_EMAIL);
}

export async function deliverHandoff(h: Handoff): Promise<{ delivered: boolean }> {
  if (!mailConfigured()) return { delivered: false };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ASK_TRA_FROM_EMAIL,
        to: [ASK_TRA.contactEmail],
        cc: ASK_TRA.handoffCc,
        reply_to: h.email,
        subject: `Ask TRA — Talk to Mike: ${h.name}`,
        text:
          `New "Talk to Mike" message from the TRA website.\n\n` +
          `From: ${h.name} <${h.email}>\n\n${h.question}\n\n` +
          `— Reply directly to this email to answer them. (Shiva: triage and draft for Mike.)`,
      }),
    });
    return { delivered: res.ok };
  } catch {
    return { delivered: false };
  }
}

/** Best-effort ops note (budget alert / cap). Content-free apart from numbers. */
export async function sendOpsAlert(subject: string, text: string): Promise<void> {
  console.warn(`[ask-tra] ${subject}: ${text}`);
  if (!mailConfigured()) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ASK_TRA_FROM_EMAIL,
        to: [ASK_TRA.contactEmail],
        cc: ASK_TRA.handoffCc,
        subject: `Ask TRA — ${subject}`,
        text,
      }),
    });
  } catch {
    // The console warning above is the durable record; email is best-effort.
  }
}
