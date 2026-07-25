"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { api, AuditResult, CleanResult, RemediationResult } from "@/lib/api";
import {
  loadCleanResult,
  saveCleanResult,
  saveAuditResult,
  saveRemediationResult,
} from "@/lib/session";
import { downloadCsv, downloadCsvPack, stamp } from "@/lib/export";
import { money, ratio } from "@/lib/format";
import { Button, Card, ModuleShell, Stat } from "@/components/ModuleShell";

const FLAG_COLOR: Record<string, string> = {
  underpaid: "#e11d48",
  overpaid: "#0d9488",
  at_market: "#64748b",
  missing: "#cbd5e1",
};

const RISK_COLOR: Record<string, string> = {
  critical: "text-rose-700 bg-rose-50",
  high: "text-orange-700 bg-orange-50",
  moderate: "text-amber-700 bg-amber-50",
  low: "text-slate-600 bg-slate-50",
};

export default function AuditorPage() {
  const [clean, setClean] = useState<CleanResult | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [remediation, setRemediation] = useState<RemediationResult | null>(null);
  const [meritPool, setMeritPool] = useState(250000);
  const [targetCompa, setTargetCompa] = useState(1.0);
  const [maxIncreasePct, setMaxIncreasePct] = useState<number | "">(15);
  const [targetMode, setTargetMode] = useState<"mid" | "expected_placement" | "max_of_both">("mid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClean(loadCleanResult());
  }, []);

  async function runAudit(records: Record<string, unknown>[]) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.auditorRun(records, 5);
      setAudit(data);
      saveAuditResult(data);
      setRemediation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadSampleAndAudit() {
    setLoading(true);
    setError(null);
    try {
      const cleaned = await api.cleanerSample();
      setClean(cleaned);
      saveCleanResult(cleaned);
      const data = await api.auditorRun(cleaned.records, 5);
      setAudit(data);
      saveAuditResult(data);
      setRemediation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sample");
    } finally {
      setLoading(false);
    }
  }

  async function runRemediation() {
    if (!clean?.records?.length) {
      setError("Clean data first, then run audit / remediation.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.remediationRun({
        records: clean.records,
        merit_pool: meritPool,
        target_compa: targetCompa,
        underpaid_only: true,
        max_increase_pct: maxIncreasePct === "" ? null : Number(maxIncreasePct),
        target_mode: targetMode,
      });
      setRemediation(data);
      saveRemediationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remediation failed");
    } finally {
      setLoading(false);
    }
  }

  async function exportPack() {
    const ts = stamp();
    const files: { filename: string; rows: Record<string, unknown>[] }[] = [];
    if (clean?.records?.length) {
      files.push({ filename: `tra_cleaned_${ts}.csv`, rows: clean.records });
    }
    if (audit?.employees?.length) {
      files.push({
        filename: `tra_equity_audit_${ts}.csv`,
        rows: audit.employees as Record<string, unknown>[],
      });
    }
    if (remediation?.allocations?.length) {
      files.push({
        filename: `tra_merit_allocations_${ts}.csv`,
        rows: remediation.allocations as Record<string, unknown>[],
      });
    }
    if (!files.length) {
      setError("Nothing to export yet — run cleaner and audit first.");
      return;
    }
    await downloadCsvPack(files);
  }

  const scatterData = useMemo(() => {
    if (!audit) return [];
    return audit.scatter
      .filter((p) => p.compa_ratio != null && p.performance != null)
      .map((p) => ({
        ...p,
        x: p.performance as number,
        y: p.compa_ratio as number,
      }));
  }, [audit]);

  return (
    <ModuleShell
      eyebrow="Module 02"
      title="Pay Equity Auditor + Remediation"
      description="Market mid-compa plus wage-calc placement (years of experience + education → expected rate). Merit pool can fund to mid, expected placement, or the max of both."
    >
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Data source</h2>
            <p className="text-sm text-slate-500">
              {clean
                ? `${clean.stats.rows_out} cleaned records · quality ${clean.stats.quality_score ?? "—"} · ${clean.source?.type || "session"}`
                : "No cleaned data — load sample or run the Cleaner first."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {clean && (
              <Button disabled={loading} onClick={() => runAudit(clean.records)}>
                {loading ? "Working…" : "Run equity + flight risk"}
              </Button>
            )}
            <Button variant="ghost" disabled={loading} onClick={loadSampleAndAudit}>
              Load sample + audit
            </Button>
            <Button
              variant="ghost"
              disabled={loading || (!clean && !audit)}
              onClick={() => void exportPack()}
            >
              Export pack (CSV)
            </Button>
            <Link
              href="/cleaner"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open Cleaner
            </Link>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
      </Card>

      {audit && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="Employees" value={String(audit.summary.total)} />
            <Stat label="Under mid" value={String(audit.summary.underpaid)} tone="bad" />
            <Stat label="Gap to mid" value={money(audit.summary.total_gap_to_parity)} tone="bad" />
            <Stat
              label="Below expected (YOE+edu)"
              value={String(audit.placement_summary?.below_expected ?? "—")}
              tone="warn"
            />
            <Stat
              label="Gap to expected"
              value={money(audit.summary.total_gap_to_expected ?? audit.placement_summary?.total_placement_gap)}
              tone="warn"
            />
            <Stat
              label="Avg flight risk"
              value={
                audit.flight_risk_summary?.avg_flight_risk != null
                  ? String(audit.flight_risk_summary.avg_flight_risk)
                  : "—"
              }
              tone="warn"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <h2 className="text-sm font-semibold text-slate-900">
                Compa-ratio heatmap (Performance × Compa-Ratio)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Red = underpaid (&lt; {audit.summary.underpaid_threshold}) · Teal = overpaid · Gray = at market
              </p>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="x" name="Performance" tick={{ fontSize: 12 }} />
                    <YAxis type="number" dataKey="y" name="Compa-Ratio" tick={{ fontSize: 12 }} />
                    <ZAxis range={[60, 60]} />
                    <ReferenceLine y={audit.summary.underpaid_threshold} stroke="#e11d48" strokeDasharray="4 4" />
                    <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="2 2" />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow">
                            <div className="font-semibold text-slate-900">{p.name || p.employee_id}</div>
                            <div className="text-slate-600">{p.job_title}</div>
                            <div>Compa: {ratio(p.y)}</div>
                            <div>Expected: {ratio(p.expected_compa)}</div>
                            <div>Perf: {p.x}</div>
                            <div>Pay: {money(p.base_salary)}</div>
                            {p.years_experience != null && (
                              <div>
                                {p.years_experience} YOE
                                {p.education_label ? ` · ${p.education_label}` : ""}
                              </div>
                            )}
                            {p.placement_gap != null && (
                              <div>Placement gap: {money(p.placement_gap)}</div>
                            )}
                            <div>Flight risk: {p.flight_risk ?? "—"}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} name="Employees">
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FLAG_COLOR[entry.equity_flag] || "#94a3b8"} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <h2 className="text-sm font-semibold text-slate-900">Top raise targets (to mid)</h2>
                <ul className="mt-4 space-y-3">
                  {audit.top_raise_targets.map((t, i) => (
                    <li key={`${t.employee_id}-${i}`} className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900">{t.name || t.employee_id}</div>
                          <div className="text-xs text-slate-500">{t.job_title}</div>
                          <div className="text-[11px] text-slate-500">
                            {t.years_experience != null ? `${t.years_experience} YOE` : "YOE —"}
                            {t.education_label ? ` · ${t.education_label}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-rose-700">{ratio(t.compa_ratio)} cr</div>
                          {t.flight_risk != null && (
                            <div className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${RISK_COLOR[t.flight_risk_band || "moderate"]}`}>
                              Risk {t.flight_risk}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-rose-700">
                        +{money(t.recommended_increase)} to mid
                        {t.expected_rate != null ? ` · expected ${money(t.expected_rate)}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              {(audit.top_placement_gaps?.length ?? 0) > 0 && (
                <Card>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Below expected placement (YOE + education)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Wage-calc lens: where they should sit in range vs actual pay.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(audit.top_placement_gaps || []).map((t, i) => (
                      <li key={i} className="rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2 text-sm">
                        <div className="font-medium text-slate-900">{t.name || t.employee_id}</div>
                        <div className="text-xs text-slate-500">
                          {t.years_experience != null ? `${t.years_experience} YOE` : "—"}
                          {t.education_label ? ` · ${t.education_label}` : ""}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-amber-800">
                          Pay {money(t.base_salary)} → expected {money(t.expected_rate)} (
                          +{money(t.recommended_increase)})
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card>
                <h2 className="text-sm font-semibold text-slate-900">Flight risk (top 5)</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Rules-based 0–100 (compa, performance, tenure). Not ML yet — explainable drivers.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                    Critical {audit.flight_risk_summary?.critical ?? 0}
                  </span>
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                    High {audit.flight_risk_summary?.high ?? 0}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    Moderate {audit.flight_risk_summary?.moderate ?? 0}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    Low {audit.flight_risk_summary?.low ?? 0}
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {(audit.top_flight_risks || []).map((r, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-slate-900">{r.name || r.employee_id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLOR[r.flight_risk_band] || ""}`}>
                          {r.flight_risk}/100
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{r.job_title}</div>
                      {r.flight_risk_drivers?.[0] && (
                        <div className="mt-1 text-xs text-slate-600">{r.flight_risk_drivers[0]}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* Remediation / Merit Pool */}
          <Card className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Remediation sandbox · Merit pool</h2>
                <p className="mt-1 text-sm text-slate-500">
                  One click to model financial solutions against a fixed pool. Priority = gap × performance + flight risk.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={loading || !clean} onClick={runRemediation}>
                  {loading ? "Allocating…" : "Fix parity (allocate pool)"}
                </Button>
                {remediation && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadCsv(
                        `tra_merit_allocations_${stamp()}.csv`,
                        remediation.allocations as Record<string, unknown>[]
                      )
                    }
                  >
                    Export allocations CSV
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Merit pool ($)
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  value={meritPool}
                  onChange={(e) => setMeritPool(Number(e.target.value))}
                />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Fund toward
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  value={targetMode}
                  onChange={(e) =>
                    setTargetMode(e.target.value as "mid" | "expected_placement" | "max_of_both")
                  }
                >
                  <option value="mid">Market mid (target compa)</option>
                  <option value="expected_placement">Expected placement (YOE + edu)</option>
                  <option value="max_of_both">Max of mid &amp; expected</option>
                </select>
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Target compa (mid mode)
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  value={targetCompa}
                  onChange={(e) => setTargetCompa(Number(e.target.value))}
                />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Max increase % (optional)
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  value={maxIncreasePct}
                  onChange={(e) =>
                    setMaxIncreasePct(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </label>
            </div>

            {remediation && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Allocated" value={money(remediation.summary.allocated)} tone="good" />
                  <Stat label="Remaining" value={money(remediation.summary.remaining)} />
                  <Stat
                    label="Funded / eligible"
                    value={`${remediation.summary.employees_funded} / ${remediation.summary.employees_eligible}`}
                  />
                  <Stat
                    label="Pool utilization"
                    value={`${remediation.summary.pool_utilization}%`}
                    tone="good"
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Employee</th>
                        <th className="px-3 py-2">Risk</th>
                        <th className="px-3 py-2">Current</th>
                        <th className="px-3 py-2">Increase</th>
                        <th className="px-3 py-2">New pay</th>
                        <th className="px-3 py-2">New CR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remediation.allocations.map((a, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-900">{a.name || a.employee_id}</div>
                            <div className="text-xs text-slate-500">{a.job_title}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLOR[a.flight_risk_band || "moderate"]}`}>
                              {a.flight_risk ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{money(a.base_salary)}</td>
                          <td className="px-3 py-2 tabular-nums font-medium text-teal-800">
                            +{money(a.allocated)}
                            {a.increase_pct != null ? ` (${a.increase_pct}%)` : ""}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{money(a.new_base_salary)}</td>
                          <td className="px-3 py-2 tabular-nums">{ratio(a.new_compa_ratio)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {remediation.unfunded.length > 0 && (
                  <p className="text-xs text-amber-700">
                    {remediation.unfunded.length} eligible employees remain unfunded after the pool was exhausted.
                  </p>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </ModuleShell>
  );
}
