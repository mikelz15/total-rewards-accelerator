import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ASK_TRA } from "@/lib/ask-tra/config";
import { RateLimiter } from "@/lib/ask-tra/ratelimit";
import { visitorKey } from "@/lib/ask-tra/guardrails";
import { getStore, monthKey } from "@/lib/ask-tra/store";
import { deliverHandoff } from "@/lib/ask-tra/mailer";

/**
 * "Talk to Mike" handoff.
 *
 * The submission goes to Rio's inbox (heyrio@mail.grokbot.com) — Rio forwards
 * to Mike and never auto-replies, so this endpoint never promises an answer
 * time either. When no mail transport is configured (the deploy-time wiring
 * item: RESEND_API_KEY + ASK_TRA_FROM_EMAIL), the submission is stored in the
 * ask_tra_handoffs table for Rio to pick up, and the UI shows the direct
 * email address as a fallback.
 *
 * The handoff text itself is a message to Rio, not analytics: the usage log
 * only gets an anonymous +1 on the handoffs counter.
 */

const handoffLimiter = new RateLimiter(1, ASK_TRA.chatWindowMs, ASK_TRA.handoffPerDay);

const HandoffBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  question: z.string().trim().min(3).max(4000),
});

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  const key = visitorKey(clientIp(request));
  if (!handoffLimiter.take(key)) {
    return NextResponse.json(
      { error: "rate_limited", contactEmail: ASK_TRA.contactEmail },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = HandoffBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }
  const handoff = parsed.data;

  const store = getStore();
  const { delivered } = await deliverHandoff(handoff);
  let stored = false;
  if (!delivered) {
    const saved = await store.saveHandoff(handoff);
    stored = saved.stored;
    if (stored) {
      // Content-free server log line so an operator can find the queue row;
      // the message itself lives only in the handoffs table / Rio's inbox.
      console.log(`[ask-tra] handoff queued id=${saved.id} (mail transport not configured)`);
    }
  }
  if (!delivered && !stored) {
    return NextResponse.json(
      { error: "handoff_failed", contactEmail: ASK_TRA.contactEmail },
      { status: 500 }
    );
  }

  await store.record(monthKey(), { handoffs: 1 });
  return NextResponse.json({ ok: true, delivered });
}
