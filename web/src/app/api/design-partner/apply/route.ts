import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/ask-tra/ratelimit";
import { visitorKey } from "@/lib/ask-tra/guardrails";
import { cleanUtm, HONEYPOT_FIELD, submissionStatus, validateApplication } from "@/lib/design-partner/fields";
import { getDesignPartnerStore } from "@/lib/design-partner/store";
import { sendApplicantConfirmation, sendReviewerCopy } from "@/lib/design-partner/mailer";

/**
 * Design Partner Year application (form on /contest).
 *
 * Validates every field server-side against lib/design-partner/fields.ts,
 * drops honeypot hits, saves the row (status "interest" before Dec 1, 2026
 * America/Denver, then "application"), and emails the reviewers plus a short
 * confirmation to the applicant when Resend is configured. A missing email
 * setup never loses a submission: it is saved and the applicant sees success.
 */

// 3 per 10 minutes, 5 per day per hashed IP (per instance).
const limiter = new RateLimiter(3, 10 * 60 * 1000, 5);

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Honeypot: pretend success, store nothing, send nothing.
  const trap = body[HONEYPOT_FIELD];
  if (typeof trap === "string" && trap.trim() !== "") {
    return NextResponse.json({ ok: true, status: submissionStatus() });
  }

  const { ok, errors, answers } = validateApplication(body);
  if (!ok) {
    return NextResponse.json({ error: "invalid_fields", fields: errors }, { status: 400 });
  }

  // Counted only for valid submissions, so fixing a typo never locks someone out.
  if (!limiter.take(visitorKey(clientIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const status = submissionStatus();
  const utm = cleanUtm(body.utm);
  const store = getDesignPartnerStore();
  const saved = await store.save(answers, { status, utm });

  const [reviewers, applicant] = await Promise.all([
    sendReviewerCopy(answers, { id: saved.id, status, utm }),
    sendApplicantConfirmation(answers, status),
  ]);
  if (saved.stored) await store.markEmailed(saved.id, { reviewers, applicant });

  // Log lines stay content-free.
  console.log(
    `[design-partner] ${status} id=${saved.id || "-"} stored=${saved.stored} reviewers=${reviewers} applicant=${applicant}`
  );

  if (!saved.stored && !reviewers) {
    return NextResponse.json({ error: "submit_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status });
}
