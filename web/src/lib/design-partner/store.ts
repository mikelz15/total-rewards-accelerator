import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { countWords, type DesignPartnerAnswers } from "./fields";

/**
 * Design Partner Year submissions -> design_partner_applications
 * (api/app/db/migrations/012_design_partner_applications.sql).
 *
 * Same pattern as the Ask TRA handoff queue: service-role key on the server
 * only, RLS on with no policies. Without SUPABASE_SERVICE_ROLE_KEY (local dev)
 * an in-memory list is used instead.
 */

export interface StoredApplication {
  id: string;
  stored: boolean;
}

export interface DesignPartnerStore {
  save(
    answers: DesignPartnerAnswers,
    meta: { status: "interest" | "application"; utm: Record<string, string> }
  ): Promise<StoredApplication>;
  markEmailed(id: string, flags: { reviewers: boolean; applicant: boolean }): Promise<void>;
}

const str = (v: unknown) => (v === undefined || v === null || v === "" ? null : String(v));
const withOther = (a: DesignPartnerAnswers, key: string) =>
  a[key] === "Other" && a[`${key}_other`] ? `Other: ${a[`${key}_other`]}` : str(a[key]);

/** Column values for the row. Every field is also kept in `answers`. */
export function toRow(
  answers: DesignPartnerAnswers,
  meta: { status: "interest" | "application"; utm: Record<string, string> }
) {
  const paragraph = String(answers.paragraph ?? "");
  return {
    status: meta.status,
    company_name: str(answers.company_name),
    industry: str(answers.industry),
    hq_states: str(answers.hq_states),
    headcount: Number(answers.headcount),
    applicant_name: str(answers.applicant_name),
    applicant_title: str(answers.applicant_title),
    applicant_email: str(answers.applicant_email),
    applicant_phone: str(answers.applicant_phone),
    applicant_role: str(answers.applicant_role),
    sponsor_name: str(answers.sponsor_name),
    sponsor_title: str(answers.sponsor_title),
    hris: withOther(answers, "hris"),
    comp_today: str(answers.comp_today),
    export_messiness: answers.export_messiness ? Number(answers.export_messiness) : null,
    top_problem: str(answers.top_problem),
    secondary_problem: str(answers.secondary_problem),
    next_cycle: str(answers.next_cycle),
    success_measure: withOther(answers, "success_measure"),
    open_to_paid: str(answers.open_to_paid),
    budget_path: str(answers.budget_path),
    first_module: str(answers.first_module),
    tried_demo: answers.tried_demo === true,
    commit_obligations: answers.commit_obligations === true,
    logo_reference_opt_in: answers.logo_reference_opt_in === true,
    front_range: str(answers.front_range),
    paragraph,
    paragraph_words: countWords(paragraph),
    answers,
    utm: meta.utm,
  };
}

class MemoryStore implements DesignPartnerStore {
  rows: Array<ReturnType<typeof toRow> & { id: string; reviewers_emailed: boolean; applicant_emailed: boolean }> = [];
  async save(answers: DesignPartnerAnswers, meta: { status: "interest" | "application"; utm: Record<string, string> }) {
    const id = `mem-${this.rows.length + 1}`;
    this.rows.push({ id, ...toRow(answers, meta), reviewers_emailed: false, applicant_emailed: false });
    return { id, stored: true };
  }
  async markEmailed(id: string, flags: { reviewers: boolean; applicant: boolean }) {
    const row = this.rows.find((r) => r.id === id);
    if (row) {
      row.reviewers_emailed = flags.reviewers;
      row.applicant_emailed = flags.applicant;
    }
  }
}

class SupabaseStore implements DesignPartnerStore {
  private client: SupabaseClient;
  constructor(url: string, key: string) {
    this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  async save(answers: DesignPartnerAnswers, meta: { status: "interest" | "application"; utm: Record<string, string> }) {
    const { data, error } = await this.client
      .from("design_partner_applications")
      .insert(toRow(answers, meta))
      .select("id")
      .single();
    if (error || !data) {
      if (error) console.error("[design-partner] save failed:", error.message);
      return { id: "", stored: false };
    }
    return { id: String(data.id), stored: true };
  }
  async markEmailed(id: string, flags: { reviewers: boolean; applicant: boolean }) {
    if (!id) return;
    const { error } = await this.client
      .from("design_partner_applications")
      .update({ reviewers_emailed: flags.reviewers, applicant_emailed: flags.applicant })
      .eq("id", id);
    if (error) console.error("[design-partner] email flag update failed:", error.message);
  }
}

let cached: DesignPartnerStore | null = null;

export function getDesignPartnerStore(): DesignPartnerStore {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    cached = new SupabaseStore(url, key);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("[design-partner] SUPABASE_SERVICE_ROLE_KEY not set — applications are kept in memory only.");
    }
    cached = new MemoryStore();
  }
  return cached;
}
