/**
 * Design Partner Year application: the ONE place the form is defined.
 *
 * The page renders these fields in order, and the API route validates every
 * submission against the same list (server-side), so adding, removing, or
 * relabeling a field is a single edit here. Answers are stored as JSON
 * (design_partner_applications: key fields as columns, everything in answers jsonb), so a new field needs no migration.
 *
 * Field kinds:
 *   text | email | tel | number | textarea -> free entry
 *   select                            -> one of `options`
 *   checkbox                          -> must be ticked when required
 *   paragraph                         -> textarea with a live word count (minWords..maxWords)
 */

export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "paragraph";

export interface DesignPartnerField {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** Short helper text under the label. */
  help?: string;
  placeholder?: string;
  options?: readonly string[];
  maxLength?: number;
  min?: number;
  max?: number;
  minWords?: number;
  maxWords?: number;
  /** Only shown (and only validated/required) when another field has this value. */
  showWhen?: { field: string; equals: string };
  /** Groups fields under a small heading on the page. */
  group: string;
}

const PROBLEMS = [
  "Merit cycle hours",
  "Pay equity or EPA readiness",
  "Messy HRIS data",
  "Offer competitiveness",
  "Job architecture",
] as const;

export const DESIGN_PARTNER_FIELDS: readonly DesignPartnerField[] = [
  // 1–4 Company
  { group: "Company", name: "company_name", label: "Company name", kind: "text", required: true, maxLength: 200 },
  { group: "Company", name: "industry", label: "Industry", kind: "text", required: true, maxLength: 200 },
  {
    group: "Company",
    name: "hq_states",
    label: "HQ / primary work state(s)",
    kind: "text",
    required: true,
    maxLength: 300,
    placeholder: "e.g. Colorado; Colorado and Utah",
  },
  {
    group: "Company",
    name: "headcount",
    label: "Approximate headcount in scope",
    kind: "number",
    required: true,
    min: 1,
    max: 2_000_000,
  },

  // 5 Applicant
  { group: "You", name: "applicant_name", label: "Your name", kind: "text", required: true, maxLength: 200 },
  { group: "You", name: "applicant_title", label: "Your title", kind: "text", required: true, maxLength: 200 },
  {
    group: "You",
    name: "applicant_email",
    label: "Work email",
    kind: "email",
    required: true,
    maxLength: 254,
    help: "We reply to this address.",
  },
  { group: "You", name: "applicant_phone", label: "Phone (optional)", kind: "tel", required: false, maxLength: 40 },
  {
    group: "You",
    name: "applicant_role",
    label: "Your role in this decision",
    kind: "select",
    required: true,
    options: ["Decision-maker", "Influencer", "Researcher"],
  },

  // 6 Sponsor
  {
    group: "Executive sponsor",
    name: "sponsor_name",
    label: "Executive sponsor name",
    kind: "text",
    required: true,
    maxLength: 200,
    help: "The comp, Total Rewards, or HR leader who will sponsor the work.",
  },
  { group: "Executive sponsor", name: "sponsor_title", label: "Executive sponsor title", kind: "text", required: true, maxLength: 200 },

  // 7 Systems
  {
    group: "How you work today",
    name: "hris",
    label: "Primary HRIS / payroll",
    kind: "select",
    required: true,
    options: ["Workday", "UKG", "ADP", "Other"],
  },
  {
    group: "How you work today",
    name: "hris_other",
    label: "Which HRIS / payroll?",
    kind: "text",
    required: true,
    maxLength: 200,
    showWhen: { field: "hris", equals: "Other" },
  },
  {
    group: "How you work today",
    name: "comp_today",
    label: "How you handle comp today",
    kind: "select",
    required: true,
    options: ["Spreadsheets", "Tools", "Both"],
  },
  {
    group: "How you work today",
    name: "export_messiness",
    label: "How messy are your HRIS exports? (1 = clean, 5 = very messy)",
    kind: "select",
    required: false,
    options: ["1", "2", "3", "4", "5"],
  },

  // 8 Problem
  {
    group: "How you work today",
    name: "top_problem",
    label: "Top problem",
    kind: "select",
    required: true,
    options: PROBLEMS,
  },
  {
    group: "How you work today",
    name: "secondary_problem",
    label: "Second problem (optional)",
    kind: "select",
    required: false,
    options: PROBLEMS,
  },

  // 9 Timing
  {
    group: "How you work today",
    name: "next_cycle",
    label: "Next merit or comp cycle (month or quarter)",
    kind: "text",
    required: true,
    maxLength: 100,
    placeholder: "e.g. March 2027 or Q1 2027",
  },

  // 10–13 Success and fit
  {
    group: "Success and fit",
    name: "success_measure",
    label: "How you will measure success",
    kind: "select",
    required: true,
    options: ["Hours saved", "Cycle time", "Audit readiness", "Other"],
  },
  {
    group: "Success and fit",
    name: "success_measure_other",
    label: "Describe your success measure",
    kind: "text",
    required: true,
    maxLength: 300,
    showWhen: { field: "success_measure", equals: "Other" },
  },
  {
    group: "Success and fit",
    name: "open_to_paid",
    label: "If not selected, are you open to a paid Design Partnership (about $50K custom build) or a short pilot?",
    kind: "select",
    required: true,
    options: ["Yes", "Maybe", "Free year only"],
  },
  {
    group: "Success and fit",
    name: "budget_path",
    label: "Do you have a budget path in the next 90 days?",
    kind: "select",
    required: false,
    options: ["Yes", "Exploring", "No"],
  },
  {
    group: "Success and fit",
    name: "first_module",
    label: "Which module would you start with?",
    kind: "select",
    required: false,
    options: ["Cleaner", "Equity + Merit (Cycle Lock)", "Candidate Closer", "Full Suite"],
  },

  // 16 Paragraph
  {
    group: "Your plan",
    name: "paragraph",
    label: "What will you do with the extra time TRA saves you? (100–150 words)",
    kind: "paragraph",
    required: true,
    minWords: 100,
    maxWords: 150,
    maxLength: 2000,
  },

  // 17 Optional extras
  {
    group: "A few more details",
    name: "front_range",
    label: "Do you have a Denver / Front Range presence? (optional)",
    kind: "select",
    required: false,
    options: ["Yes", "No"],
  },

  // 14–15, 17 Confirmations
  {
    group: "Confirmations",
    name: "tried_demo",
    label: "I tried the sample-data demo at totalrewardsaccelerator.com",
    kind: "checkbox",
    required: true,
  },
  {
    group: "Confirmations",
    name: "commit_obligations",
    label: "If selected, I commit to the winner obligations listed on this page",
    kind: "checkbox",
    required: true,
  },
  {
    group: "Confirmations",
    name: "logo_reference_opt_in",
    label: "If selected, you may ask to use our logo or contact us for a reference call (optional)",
    kind: "checkbox",
    required: false,
  },
] as const;

/** Hidden UTM fields captured from the page URL. */
export const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export const DEFAULT_CAMPAIGN = "design_partner_year";

/**
 * Before December 1, 2026 (America/Denver) submissions are stored as
 * "interest"; from then on as "application". Midnight MST = 07:00 UTC.
 */
export const APPLICATIONS_OPEN_AT = new Date("2026-12-01T07:00:00Z");

export function submissionStatus(now = new Date()): "interest" | "application" {
  return now.getTime() < APPLICATIONS_OPEN_AT.getTime() ? "interest" : "application";
}

/** Hidden spam trap. Real people never see or fill it. */
export const HONEYPOT_FIELD = "website";

export type DesignPartnerAnswers = Record<string, string | number | boolean>;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isFieldVisible(field: DesignPartnerField, values: Record<string, unknown>): boolean {
  if (!field.showWhen) return true;
  return String(values[field.showWhen.field] ?? "") === field.showWhen.equals;
}

/**
 * Validate raw input against DESIGN_PARTNER_FIELDS. Used by the page (for inline
 * errors) and by the API route (the authority). Unknown keys are dropped.
 */
export function validateApplication(raw: Record<string, unknown>): {
  ok: boolean;
  errors: Record<string, string>;
  answers: DesignPartnerAnswers;
} {
  const errors: Record<string, string> = {};
  const answers: DesignPartnerAnswers = {};

  for (const f of DESIGN_PARTNER_FIELDS) {
    if (!isFieldVisible(f, raw)) continue;
    const value = raw[f.name];

    if (f.kind === "checkbox") {
      const on = value === true || value === "true" || value === "on";
      if (f.required && !on) errors[f.name] = "Please confirm.";
      answers[f.name] = on;
      continue;
    }

    const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
    if (!text) {
      if (f.required) errors[f.name] = "Required.";
      continue;
    }
    if (f.maxLength && text.length > f.maxLength) {
      errors[f.name] = `Keep this under ${f.maxLength} characters.`;
      continue;
    }

    switch (f.kind) {
      case "tel":
        if (!/^[0-9+().\-\s x]{7,40}$/i.test(text)) errors[f.name] = "Enter a valid phone number.";
        else answers[f.name] = text;
        break;
      case "email":
        if (!EMAIL_RE.test(text)) errors[f.name] = "Enter a valid email address.";
        else answers[f.name] = text;
        break;
      case "number": {
        const n = Number(text.replace(/,/g, ""));
        if (!Number.isFinite(n) || !Number.isInteger(n)) errors[f.name] = "Enter a whole number.";
        else if ((f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max))
          errors[f.name] = `Enter a number from ${f.min ?? 0} to ${f.max?.toLocaleString("en-US") ?? "∞"}.`;
        else answers[f.name] = n;
        break;
      }
      case "select":
        if (!f.options?.includes(text)) errors[f.name] = "Choose one of the options.";
        else answers[f.name] = text;
        break;
      case "paragraph": {
        const words = countWords(text);
        if (f.minWords && words < f.minWords) errors[f.name] = `Write at least ${f.minWords} words (now ${words}).`;
        else if (f.maxWords && words > f.maxWords) errors[f.name] = `Keep it to ${f.maxWords} words (now ${words}).`;
        else answers[f.name] = text;
        break;
      }
      default:
        answers[f.name] = text;
    }
  }

  if (
    answers.secondary_problem &&
    answers.secondary_problem === answers.top_problem &&
    !errors.secondary_problem
  ) {
    errors.secondary_problem = "Pick a different problem, or leave this blank.";
  }

  return { ok: Object.keys(errors).length === 0, errors, answers };
}

/** Keep only the five UTM keys, short plain strings; default the campaign tag. */
export function cleanUtm(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  for (const k of UTM_FIELDS) {
    const v = src[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 200);
  }
  if (!out.utm_campaign) out.utm_campaign = DEFAULT_CAMPAIGN;
  return out;
}

/** Plain-text copy of every field, in form order, for the reviewer email. */
export function formatApplication(answers: DesignPartnerAnswers): string {
  const lines: string[] = [];
  let group = "";
  for (const f of DESIGN_PARTNER_FIELDS) {
    if (!(f.name in answers) && f.showWhen) continue;
    if (f.group !== group) {
      group = f.group;
      lines.push("", `== ${group} ==`);
    }
    const v = answers[f.name];
    const shown = v === undefined || v === "" ? "(not provided)" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
    if (f.kind === "paragraph" || f.kind === "textarea") {
      const words = typeof v === "string" ? ` (${countWords(v)} words)` : "";
      lines.push(`${f.label}${f.kind === "paragraph" ? words : ""}:`, shown);
    } else {
      lines.push(`${f.label}: ${shown}`);
    }
  }
  return lines.join("\n").trim();
}
