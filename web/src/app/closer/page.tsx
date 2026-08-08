"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, WealthProjection } from "@/lib/api";
import { money } from "@/lib/format";
import { Button, Card, ModuleShell, Stat } from "@/components/ModuleShell";

type FormState = {
  base_salary: number;
  target_bonus_pct: number;
  lti_target_value: number;
  company_name: string;
  candidate_name: string;
  job_title: string;
  years: number;
  salary_growth_rate: number;
  lti_vest_years: number;
  years_experience: number;
  education: string;
  required_education: string;
  range_min: number;
  range_mid: number;
  range_max: number;
  use_recommended_base: boolean;
};

const defaults: FormState = {
  base_salary: 180000,
  target_bonus_pct: 15,
  lti_target_value: 300000,
  company_name: "Acme Health Systems",
  candidate_name: "Alex Rivera",
  job_title: "Senior Compensation Partner",
  years: 4,
  salary_growth_rate: 0.03,
  lti_vest_years: 4,
  years_experience: 8,
  education: "Masters",
  required_education: "Bachelors",
  range_min: 140000,
  range_mid: 175000,
  range_max: 210000,
  use_recommended_base: false,
};

export default function CloserPage() {
  const [form, setForm] = useState<FormState>(defaults);
  const [projection, setProjection] = useState<WealthProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    const role = params.get("role");
    const base = params.get("base");
    const bonus = params.get("bonus");
    const lti = params.get("lti");
    if (name || role || base || bonus || lti) {
      setForm((prev) => ({
        ...prev,
        candidate_name: name || prev.candidate_name,
        job_title: role || prev.job_title,
        base_salary: base ? Number(base) : prev.base_salary,
        target_bonus_pct: bonus ? Number(bonus) : prev.target_bonus_pct,
        lti_target_value: lti ? Number(lti) : prev.lti_target_value,
      }));
    }
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function project() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.closerProject(form);
      setProjection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Projection failed");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    setLoading(true);
    setError(null);
    try {
      const blob = await api.closerPdf(form);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `total_wealth_${form.candidate_name.replace(/\s+/g, "_").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      if (!projection) {
        const data = await api.closerProject(form);
        setProjection(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModuleShell
      eyebrow="Module 04"
      title="Candidate Closer"
      description="Translate base, bonus, and LTI into a multi-year total wealth trajectory. Generate a one-page PDF that turns offer letters into closing tools — the four-year view most market tools skip."
    >
      <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-950">
        <p className="font-semibold">Sample data only (public demo)</p>
        <p className="mt-1 text-rose-900/90">
          Use the default synthetic persona or open a sample from Candidate Tracker. Do not enter
          real candidate names or compensation. Full production use is available via pilot / paid
          Closer module.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Compensation inputs (sample)</h2>
          <div className="mt-4 space-y-3">
            <Field label="Candidate name">
              <input
                className={inputClass}
                value={form.candidate_name}
                onChange={(e) => update("candidate_name", e.target.value)}
              />
            </Field>
            <Field label="Job title">
              <input
                className={inputClass}
                value={form.job_title}
                onChange={(e) => update("job_title", e.target.value)}
              />
            </Field>
            <Field label="Company">
              <input
                className={inputClass}
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
              />
            </Field>
            <Field label="Base salary ($)">
              <input
                type="number"
                className={inputClass}
                value={form.base_salary}
                onChange={(e) => update("base_salary", Number(e.target.value))}
              />
            </Field>
            <Field label="Target bonus (%)">
              <input
                type="number"
                className={inputClass}
                value={form.target_bonus_pct}
                onChange={(e) => update("target_bonus_pct", Number(e.target.value))}
              />
            </Field>
            <Field label="LTI target value / RSUs ($)">
              <input
                type="number"
                className={inputClass}
                value={form.lti_target_value}
                onChange={(e) => update("lti_target_value", Number(e.target.value))}
              />
            </Field>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Wage-calc placement (YOE + education)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Years of experience">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.years_experience}
                    onChange={(e) => update("years_experience", Number(e.target.value))}
                  />
                </Field>
                <Field label="Education">
                  <select
                    className={inputClass}
                    value={form.education}
                    onChange={(e) => update("education", e.target.value)}
                  >
                    {["High School/GED", "Associates", "Bachelors", "Masters", "Doctorate"].map(
                      (e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      )
                    )}
                  </select>
                </Field>
                <Field label="Required education">
                  <select
                    className={inputClass}
                    value={form.required_education}
                    onChange={(e) => update("required_education", e.target.value)}
                  >
                    {["High School/GED", "Associates", "Bachelors", "Masters", "Doctorate"].map(
                      (e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      )
                    )}
                  </select>
                </Field>
                <Field label="Range min">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.range_min}
                    onChange={(e) => update("range_min", Number(e.target.value))}
                  />
                </Field>
                <Field label="Range mid">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.range_mid}
                    onChange={(e) => update("range_mid", Number(e.target.value))}
                  />
                </Field>
                <Field label="Range max">
                  <input
                    type="number"
                    className={inputClass}
                    value={form.range_max}
                    onChange={(e) => update("range_max", Number(e.target.value))}
                  />
                </Field>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.use_recommended_base}
                  onChange={(e) => update("use_recommended_base", e.target.checked)}
                />
                Project wealth using recommended base (expected placement)
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={loading} onClick={project}>
              {loading ? "Working…" : "Project total wealth"}
            </Button>
            <Button variant="secondary" disabled={loading} onClick={downloadPdf}>
              Download PDF statement
            </Button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
        </Card>

        <div className="space-y-6">
          {projection ? (
            <>
              {projection.placement?.expected_rate != null && (
                <Card>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Placement recommendation (wage-calc)
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Stat
                      label="Expected rate"
                      value={money(projection.placement.expected_rate)}
                      tone="good"
                    />
                    <Stat
                      label="Offer / actual base"
                      value={money(projection.inputs.base_salary)}
                    />
                    <Stat
                      label="Placement gap"
                      value={money(projection.placement.placement_gap)}
                      tone={
                        (projection.placement.placement_gap ?? 0) > 0
                          ? "bad"
                          : (projection.placement.placement_gap ?? 0) < 0
                            ? "good"
                            : "default"
                      }
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    {projection.placement.years_experience != null
                      ? `${projection.placement.years_experience} YOE`
                      : ""}
                    {projection.placement.candidate_education_label
                      ? ` · ${projection.placement.candidate_education_label}`
                      : ""}
                    {projection.placement.total_credit_years != null
                      ? ` · ${projection.placement.total_credit_years} credit years`
                      : ""}
                    {projection.placement.expected_compa != null
                      ? ` · expected compa ${projection.placement.expected_compa}`
                      : ""}
                    {projection.placement.actual_compa != null
                      ? ` · actual compa ${projection.placement.actual_compa}`
                      : ""}
                    {" · "}
                    flag: {projection.placement.placement_flag || "—"}
                  </p>
                </Card>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Year-1 total" value={money(projection.summary.year_1_total)} tone="good" />
                <Stat label="4-year cumulative" value={money(projection.grand_total)} />
                <Stat
                  label="Year-1 cash (base+bonus)"
                  value={money(projection.summary.year_1_cash)}
                />
              </div>

              <Card>
                <h2 className="text-sm font-semibold text-slate-900">
                  {projection.meta.years}-year stacked projection
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {projection.meta.candidate_name} · {projection.meta.job_title}
                </p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projection.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tickFormatter={(y) => `Y${y}`} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={56} />
                      <Tooltip
                        formatter={(value) => money(typeof value === "number" ? value : Number(value))}
                        labelFormatter={(y) => `Year ${y}`}
                      />
                      <Legend />
                      <Bar dataKey="base" stackId="a" fill="#1e3a5f" name="Base" />
                      <Bar dataKey="bonus" stackId="a" fill="#0d9488" name="Bonus" />
                      <Bar dataKey="vesting" stackId="a" fill="#5eead4" name="LTI vesting" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="overflow-hidden p-0">
                <div className="border-b border-slate-100 px-5 py-3">
                  <h2 className="text-sm font-semibold text-slate-900">Year-by-year detail</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Year</th>
                        <th className="px-4 py-2">Base</th>
                        <th className="px-4 py-2">Bonus</th>
                        <th className="px-4 py-2">Vesting</th>
                        <th className="px-4 py-2">Year total</th>
                        <th className="px-4 py-2">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projection.timeline.map((t) => (
                        <tr key={t.year} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-medium">Y{t.year}</td>
                          <td className="px-4 py-2 tabular-nums">{money(t.base)}</td>
                          <td className="px-4 py-2 tabular-nums">{money(t.bonus)}</td>
                          <td className="px-4 py-2 tabular-nums">{money(t.vesting)}</td>
                          <td className="px-4 py-2 tabular-nums font-medium">{money(t.year_total)}</td>
                          <td className="px-4 py-2 tabular-nums">{money(t.cumulative)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <p className="text-sm text-slate-500">
                Enter offer assumptions and click <strong>Project total wealth</strong> (or download
                the PDF in one step). Defaults mirror the portfolio deck example ($180k / 15% / $300k
                LTI).
              </p>
            </Card>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
