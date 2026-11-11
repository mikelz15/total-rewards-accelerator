import { describe, expect, it } from "vitest";
import {
  DESIGN_PARTNER_FIELDS,
  cleanUtm,
  countWords,
  formatApplication,
  submissionStatus,
  validateApplication,
} from "@/lib/design-partner/fields";
import { applicantEmail, reviewerEmail, DESIGN_PARTNER_REVIEWERS } from "@/lib/design-partner/mailer";
import { toRow } from "@/lib/design-partner/store";

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

function valid(): Record<string, unknown> {
  return {
    company_name: "Northline Regional",
    industry: "Healthcare",
    hq_states: "Colorado",
    headcount: "2,400",
    applicant_name: "Avery Chen",
    applicant_title: "Director, Total Rewards",
    applicant_email: "avery@example.com",
    applicant_phone: "",
    applicant_role: "Decision-maker",
    sponsor_name: "Ellis Ward",
    sponsor_title: "CHRO",
    hris: "Other",
    hris_other: "Paylocity",
    comp_today: "Both",
    export_messiness: "4",
    top_problem: "Merit cycle hours",
    secondary_problem: "Job architecture",
    next_cycle: "Q1 2027",
    success_measure: "Hours saved",
    open_to_paid: "Maybe",
    budget_path: "",
    first_module: "Full Suite",
    tried_demo: true,
    commit_obligations: true,
    logo_reference_opt_in: false,
    front_range: "Yes",
    paragraph: words(120),
  };
}

describe("design partner fields", () => {
  it("accepts a complete submission and normalizes values", () => {
    const r = validateApplication(valid());
    expect(r.errors).toEqual({});
    expect(r.ok).toBe(true);
    expect(r.answers.headcount).toBe(2400);
    expect(r.answers.hris_other).toBe("Paylocity");
    expect(r.answers.success_measure_other).toBeUndefined();
  });

  it("requires every required field", () => {
    const r = validateApplication({});
    const required = DESIGN_PARTNER_FIELDS.filter((f) => f.required && !f.showWhen).map((f) => f.name);
    for (const name of required) expect(r.errors[name], name).toBeTruthy();
  });

  it("enforces the 100–150 word paragraph", () => {
    expect(validateApplication({ ...valid(), paragraph: words(99) }).errors.paragraph).toMatch(/at least 100/);
    expect(validateApplication({ ...valid(), paragraph: words(151) }).errors.paragraph).toMatch(/150/);
    expect(validateApplication({ ...valid(), paragraph: words(150) }).ok).toBe(true);
    expect(countWords("  a  b\nc ")).toBe(3);
  });

  it("requires the Other text only when Other is chosen", () => {
    expect(validateApplication({ ...valid(), hris_other: "" }).errors.hris_other).toBeTruthy();
    expect(validateApplication({ ...valid(), hris: "Workday", hris_other: "" }).ok).toBe(true);
    expect(validateApplication({ ...valid(), success_measure: "Other" }).errors.success_measure_other).toBeTruthy();
  });

  it("rejects bad email, off-list options, unticked confirmations, same secondary problem", () => {
    const r = validateApplication({
      ...valid(),
      applicant_email: "nope",
      comp_today: "Abacus",
      tried_demo: false,
      commit_obligations: false,
      secondary_problem: "Merit cycle hours",
    });
    expect(Object.keys(r.errors).sort()).toEqual(
      ["applicant_email", "commit_obligations", "comp_today", "secondary_problem", "tried_demo"].sort()
    );
  });

  it("stores interest before Dec 1, 2026 Denver time and application after", () => {
    expect(submissionStatus(new Date("2026-12-01T06:59:59Z"))).toBe("interest");
    expect(submissionStatus(new Date("2026-12-01T07:00:00Z"))).toBe("application");
  });

  it("keeps only UTM keys and defaults the campaign", () => {
    expect(cleanUtm({ utm_source: "linkedin", evil: "x" })).toEqual({
      utm_source: "linkedin",
      utm_campaign: "design_partner_year",
    });
  });

  it("maps answers to table columns", () => {
    const { answers } = validateApplication(valid());
    const row = toRow(answers, { status: "interest", utm: {} });
    expect(row.hris).toBe("Other: Paylocity");
    expect(row.export_messiness).toBe(4);
    expect(row.paragraph_words).toBe(120);
    expect(row.applicant_phone).toBeNull();
    expect(row.status).toBe("interest");
  });

  it("emails every field to both reviewers, replying to the applicant", () => {
    const { answers } = validateApplication(valid());
    const mail = reviewerEmail(answers, { id: "abc", status: "interest", utm: { utm_campaign: "design_partner_year" } });
    expect(DESIGN_PARTNER_REVIEWERS).toEqual(["heyrio@mail.grokbot.com", "shiva@send.totalrewardsaccelerator.com"]);
    expect(mail.to).toEqual(DESIGN_PARTNER_REVIEWERS);
    expect(mail.reply_to).toBe("avery@example.com");
    for (const f of DESIGN_PARTNER_FIELDS) {
      if (f.showWhen && !(f.name in answers)) continue;
      expect(mail.text, f.name).toContain(f.label);
    }
    expect(formatApplication(answers)).toContain("Paylocity");
    const conf = applicantEmail(answers, "interest");
    expect(conf.to).toEqual(["avery@example.com"]);
    expect(conf.subject + " " + conf.text.replace("/contest", "")).not.toMatch(/contest|raffle|sweepstakes|lottery/i);
  });
});
