import { mailConfigured } from "@/lib/ask-tra/mailer";
import { formatApplication, type DesignPartnerAnswers } from "./fields";

/**
 * Email for Design Partner Year submissions. Same Resend setup as the
 * "Talk to Mike" handoff: RESEND_API_KEY + ASK_TRA_FROM_EMAIL
 * (form@send.totalrewardsaccelerator.com). If either is missing, nothing is
 * sent and the caller still saves the submission.
 */

export const DESIGN_PARTNER_REVIEWERS = (
  process.env.DESIGN_PARTNER_REVIEWERS || "heyrio@mail.grokbot.com,shiva@send.totalrewardsaccelerator.com"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

async function send(payload: Record<string, unknown>): Promise<boolean> {
  if (!mailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.ASK_TRA_FROM_EMAIL, ...payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function reviewerEmail(
  answers: DesignPartnerAnswers,
  meta: { id: string; status: string; utm: Record<string, string> }
) {
  const label = meta.status === "interest" ? "Interest (before Dec 1)" : "Application";
  const utm = Object.entries(meta.utm)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return {
    to: DESIGN_PARTNER_REVIEWERS,
    reply_to: String(answers.applicant_email),
    subject: `Design Partner Year ${meta.status} — ${answers.company_name}`,
    text:
      `New Design Partner Year submission from the TRA website.\n` +
      `Status: ${label}\nRecord id: ${meta.id || "(not stored)"}\n\n` +
      `${formatApplication(answers)}\n\n== Source ==\n${utm}\n\n` +
      `— Reply to this email to reach the applicant.`,
  };
}

export function applicantEmail(answers: DesignPartnerAnswers, status: string) {
  const first = String(answers.applicant_name || "").split(/\s+/)[0] || "there";
  const when =
    status === "interest"
      ? "Applications open December 1, 2026. We have saved yours as early interest and will review it with the full group."
      : "We have your application and will review it with the full group.";
  return {
    to: [String(answers.applicant_email)],
    subject: "We received your Design Partner Year application",
    text:
      `Hi ${first},\n\n` +
      `Thanks for applying to the Total Rewards Accelerator Design Partner Year for ${answers.company_name}. ` +
      `${when} Winners are announced January 2, 2027.\n\n` +
      `If anything changes before then, reply to this email.\n\n— The TRA team\nhttps://totalrewardsaccelerator.com/contest`,
  };
}

export async function sendReviewerCopy(
  answers: DesignPartnerAnswers,
  meta: { id: string; status: string; utm: Record<string, string> }
) {
  return send(reviewerEmail(answers, meta));
}

export async function sendApplicantConfirmation(answers: DesignPartnerAnswers, status: string) {
  return send(applicantEmail(answers, status));
}
