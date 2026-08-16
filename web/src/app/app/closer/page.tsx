"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { money } from "@/lib/format";
import { Button, Card, Stat } from "@/components/ModuleShell";
import { ModuleGate } from "@/components/ModuleGate";
import { useWorkspace } from "@/lib/workspace-context";

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
  company_name: "Your Company",
  candidate_name: "Candidate",
  job_title: "Role",
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

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

const EDU = ["High School/GED", "Associates", "Bachelors", "Masters", "Doctorate"];

type Candidate = {
  id: string;
  name: string;
  role: string;
  base_salary: number;
  target_bonus_pct?: number;
  lti_target_value?: number;
  company_name?: string;
};

type Projection = {
  inputs?: { base_salary?: number };
  summary?: { year_1_total?: number; year_1_cash?: number };
  grand_total?: number;
  schedule?: {
    year?: number;
    base?: number;
    base_salary?: number;
    bonus?: number;
    lti?: number;
    total?: number;
  }[];
  placement?: {
    expected_rate?: number | null;
    placement_gap?: number | null;
    expected_compa?: number | null;
    actual_compa?: number | null;
    placement_flag?: string;
    years_experience?: number | null;
    candidate_education_label?: string;
    total_credit_years?: number | null;
  };
  run_id?: string;
  totals?: Record<string, number>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function AppCloserPage() {
  const { permissions } = useWorkspace();
  const [form, setForm] = useState<FormState>(defaults);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await saasApi.listCandidates(token);
        if (!cancelled) setCandidates((res.candidates as Candidate[]) || []);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function loadCandidate(c: Candidate) {
    setForm((prev) => ({
      ...prev,
      candidate_name: c.name,
      job_title: c.role,
      base_salary: Number(c.base_salary) || prev.base_salary,
      target_bonus_pct: Number(c.target_bonus_pct) || prev.target_bonus_pct,
      lti_target_value: Number(c.lti_target_value) || prev.lti_target_value,
      company_name: c.company_name || prev.company_name,
    }));
    setProjection(null);
  }

  async function project() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = (await saasApi.closerProject(token, {
        ...form,
        save: true,
      })) as Projection;
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
      const token = await getAccessToken();
      const blob = await saasApi.closerPdf(token, { ...form, save: false });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `total_wealth_${form.candidate_name.replace(/\s+/g, "_").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      if (!projection) {
        const data = (await saasApi.closerProject(token, {
          ...form,
          save: true,
        })) as Projection;
        setProjection(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF failed");
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => {
    const schedule = projection?.schedule || [];
    return schedule.map((row, i) => ({
      year: `Y${row.year ?? i + 1}`,
      Base: Number(row.base ?? row.base_salary ?? 0),
      Bonus: Number(row.bonus ?? 0),
      LTI: Number(row.lti ?? 0),
    }));
  }, [projection]);

  const grand =
    projection?.grand_total ??
    projection?.totals?.total_wealth ??
    projection?.totals?.grand_total;

  return (
    <ModuleGate module="closer" permissions={permissions}>
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace · Closer
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Candidate closer
        </h1>
        <p className="mt-2 text-slate-600">
          Turn base, bonus, and LTI into a multi-year total wealth trajectory and one-page offer PDF
          — real org data, not the public sample-only demo.
        </p>
      </div>

      <div className="rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-950">
        <p className="font-semibold">Production workspace</p>
        <p className="mt-1 text-teal-900/90">
          Offers you model here are saved as analysis runs for your organization. Prefer scrubbed
          candidate data; you control retention.
        </p>
      </div>

      {candidates.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Load from pipeline</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidates.slice(0, 16).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => loadCandidate(c)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-teal-300 hover:bg-teal-50"
              >
                {c.name}
                <span className="ml-1 text-slate-400">· {c.role}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Compensation inputs</h2>
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
            <div className="grid grid-cols-2 gap-2">
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
            </div>
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
                Placement (YOE + education)
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
                    {EDU.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Required education">
                  <select
                    className={inputClass}
                    value={form.required_education}
                    onChange={(e) => update("required_education", e.target.value)}
                  >
                    {EDU.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
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
                    Placement recommendation
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Stat
                      label="Expected rate"
                      value={money(projection.placement.expected_rate)}
                      tone="good"
                    />
                    <Stat
                      label="Offer / actual base"
                      value={money(projection.inputs?.base_salary ?? form.base_salary)}
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
                </Card>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Year-1 total"
                  value={money(projection.summary?.year_1_total)}
                  tone="good"
                />
                <Stat label="Multi-year cumulative" value={money(grand)} />
                <Stat
                  label="Year-1 cash"
                  value={money(projection.summary?.year_1_cash)}
                />
              </div>

              <Card>
                <h2 className="text-sm font-semibold text-slate-900">Year-by-year mix</h2>
                <div className="mt-4 h-64">
                  {chartData.length === 0 ? (
                    <p className="text-sm text-slate-500">No schedule rows returned.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip
                          formatter={(v) => money(typeof v === "number" ? v : Number(v))}
                        />
                        <Legend />
                        <Bar dataKey="Base" stackId="a" fill="#0f172a" />
                        <Bar dataKey="Bonus" stackId="a" fill="#0d9488" />
                        <Bar dataKey="LTI" stackId="a" fill="#5eead4" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {projection.run_id && (
                  <p className="mt-2 text-xs text-slate-500">
                    Saved run {String(projection.run_id).slice(0, 8)}…
                  </p>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <h2 className="text-sm font-semibold text-slate-900">Projection</h2>
              <p className="mt-3 text-sm text-slate-500">
                Run a projection to see multi-year base, bonus, LTI, and total wealth — then download
                a one-page PDF for the offer conversation.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
    </ModuleGate>
  );
}
