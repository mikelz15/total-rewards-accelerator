"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { getAccessToken, saasApi, type DatasetSummary } from "@/lib/saas-api";
import { money, ratio } from "@/lib/format";
import { Button, Card, Stat } from "@/components/ModuleShell";
import { ModuleGate } from "@/components/ModuleGate";
import { useWorkspace } from "@/lib/workspace-context";
import { downloadCsv, stamp } from "@/lib/export";

const FLAG_COLOR: Record<string, string> = {
  underpaid: "#e11d48",
  overpaid: "#0d9488",
  at_market: "#64748b",
  missing: "#cbd5e1",
};

const RISK_PILL: Record<string, string> = {
  critical: "text-rose-700 bg-rose-50",
  high: "text-orange-700 bg-orange-50",
  moderate: "text-amber-700 bg-amber-50",
  low: "text-slate-600 bg-slate-50",
};

type AuditResult = {
  summary?: {
    total?: number;
    underpaid?: number;
    overpaid?: number;
    at_market?: number;
    avg_compa_ratio?: number | null;
    total_gap_to_parity?: number;
    total_gap_to_expected?: number;
    underpaid_threshold?: number;
  };
  placement_summary?: {
    below_expected?: number;
    total_placement_gap?: number;
  };
  flight_risk_summary?: {
    critical?: number;
    high?: number;
    moderate?: number;
    low?: number;
    avg_flight_risk?: number | null;
  };
  scatter?: {
    name?: string;
    employee_id?: string;
    job_title?: string;
    performance?: number | null;
    compa_ratio?: number | null;
    expected_compa?: number | null;
    base_salary?: number | null;
    equity_flag?: string;
    years_experience?: number | null;
    education_label?: string;
    placement_gap?: number | null;
    flight_risk?: number;
    flight_risk_band?: string;
  }[];
  top_raise_targets?: {
    name?: string;
    job_title?: string;
    gap_to_mid?: number;
    recommended_increase?: number;
    flight_risk_band?: string;
    compa_ratio?: number | null;
    base_salary?: number | null;
  }[];
  top_flight_risks?: {
    name?: string;
    job_title?: string;
    flight_risk?: number;
    flight_risk_band?: string;
    flight_risk_drivers?: string[];
  }[];
  employees?: Record<string, unknown>[];
  run_id?: string;
};

type RemResult = {
  summary?: {
    merit_pool?: number;
    allocated?: number;
    remaining?: number;
    employees_funded?: number;
    employees_eligible?: number;
    avg_increase_pct?: number | null;
    pool_utilization?: number;
  };
  allocations?: {
    name?: string;
    job_title?: string;
    allocated?: number;
    increase_pct?: number | null;
    new_base_salary?: number;
    fully_funded?: boolean;
    flight_risk_band?: string;
  }[];
  unfunded?: Record<string, unknown>[];
  run_id?: string;
};

export default function AppEquityPage() {
  const { permissions } = useWorkspace();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [meritPool, setMeritPool] = useState(250000);
  const [targetCompa, setTargetCompa] = useState(1.0);
  const [targetMode, setTargetMode] = useState<"mid" | "expected_placement" | "max_of_both">(
    "mid"
  );
  const [maxIncreasePct, setMaxIncreasePct] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [remediation, setRemediation] = useState<RemResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await saasApi.listDatasets(token);
        if (cancelled) return;
        setDatasets(res.datasets);
        if (res.datasets[0]) setDatasetId(res.datasets[0].id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load datasets");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scatterData = useMemo(() => {
    if (!audit?.scatter) return [];
    return audit.scatter
      .filter((p) => p.compa_ratio != null && p.performance != null)
      .map((p) => ({
        ...p,
        x: p.performance as number,
        y: p.compa_ratio as number,
      }));
  }, [audit]);

  async function runAudit() {
    if (!datasetId) {
      setError("Save a dataset from Cleaner first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = (await saasApi.auditorRun(token, {
        dataset_id: datasetId,
        top_n: 8,
        lens: "both",
        save: true,
      })) as AuditResult;
      setAudit(data);
      setRemediation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  async function runMerit() {
    if (!datasetId) {
      setError("Select a saved dataset first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = (await saasApi.remediationRun(token, {
        dataset_id: datasetId,
        merit_pool: meritPool,
        target_compa: targetCompa,
        underpaid_only: true,
        max_increase_pct: maxIncreasePct,
        target_mode: targetMode,
        save: true,
      })) as RemResult;
      setRemediation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remediation failed");
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    const ts = stamp();
    if (remediation?.allocations?.length) {
      await downloadCsv(
        `tra_saas_merit_${ts}.csv`,
        remediation.allocations as Record<string, unknown>[]
      );
      return;
    }
    if (audit?.employees?.length) {
      await downloadCsv(`tra_saas_equity_${ts}.csv`, audit.employees);
      return;
    }
    setError("Run equity or merit first to export.");
  }

  const selected = datasets.find((d) => d.id === datasetId);
  const thr = audit?.summary?.underpaid_threshold ?? 0.9;

  return (
    <ModuleGate module="equity" permissions={permissions}>
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace · Equity + Merit
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Pay equity &amp; merit remediation
        </h1>
        <p className="mt-2 text-slate-600">
          Dual-lens equity (market mid + YOE/education placement), flight risk, and defendable merit
          pool allocation on your saved org datasets.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[16rem] flex-1">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Saved dataset
              </span>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              >
                {datasets.length === 0 ? (
                  <option value="">No datasets yet</option>
                ) : (
                  datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.row_count} rows
                    </option>
                  ))
                )}
              </select>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              {selected
                ? `${selected.row_count} rows · ${selected.source_filename || "upload"}`
                : "Run Cleaner in the workspace to save a dataset."}
              {" · "}
              <Link href="/app/cleaner" className="font-medium text-teal-800 hover:underline">
                Open Cleaner
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={loading || !datasetId} onClick={runAudit}>
              {loading ? "Working…" : "Run equity + flight risk"}
            </Button>
            <Button variant="ghost" disabled={loading || (!audit && !remediation)} onClick={() => void exportCsv()}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Merit pool ($)
            </span>
            <input
              type="number"
              value={meritPool}
              onChange={(e) => setMeritPool(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Target compa
            </span>
            <input
              type="number"
              step="0.01"
              value={targetCompa}
              onChange={(e) => setTargetCompa(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Max increase %
            </span>
            <input
              type="number"
              value={maxIncreasePct}
              onChange={(e) => setMaxIncreasePct(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Target mode
            </span>
            <select
              value={targetMode}
              onChange={(e) =>
                setTargetMode(e.target.value as "mid" | "expected_placement" | "max_of_both")
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="mid">Market mid</option>
              <option value="expected_placement">Expected placement</option>
              <option value="max_of_both">Max of both</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={loading || !datasetId} onClick={runMerit}>
            {loading ? "Working…" : "Allocate merit pool"}
          </Button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {(audit?.run_id || remediation?.run_id) && (
          <p className="mt-2 text-xs text-slate-500">
            Saved analysis
            {audit?.run_id ? ` · audit ${String(audit.run_id).slice(0, 8)}…` : ""}
            {remediation?.run_id ? ` · merit ${String(remediation.run_id).slice(0, 8)}…` : ""}
          </p>
        )}
      </Card>

      {audit?.summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="Employees" value={String(audit.summary.total ?? "—")} />
            <Stat label="Under mid" value={String(audit.summary.underpaid ?? "—")} tone="bad" />
            <Stat
              label="Gap to mid"
              value={money(audit.summary.total_gap_to_parity)}
              tone="bad"
            />
            <Stat
              label="Below expected"
              value={String(audit.placement_summary?.below_expected ?? "—")}
              tone="warn"
            />
            <Stat
              label="Gap to expected"
              value={money(
                audit.summary.total_gap_to_expected ??
                  audit.placement_summary?.total_placement_gap
              )}
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

          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <h2 className="text-sm font-semibold text-slate-900">
                Compa heatmap (performance × compa-ratio)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Red = under mid (&lt; {thr}) · Teal = over · Gray = at market
              </p>
              <div className="mt-4 h-80">
                {scatterData.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No scatter points (need performance + compa on records).
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="x" name="Performance" tick={{ fontSize: 12 }} />
                      <YAxis type="number" dataKey="y" name="Compa" tick={{ fontSize: 12 }} />
                      <ZAxis range={[60, 60]} />
                      <ReferenceLine y={thr} stroke="#e11d48" strokeDasharray="4 4" />
                      <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="2 2" />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow">
                              <div className="font-semibold">{p.name || p.employee_id}</div>
                              <div className="text-slate-600">{p.job_title}</div>
                              <div>Compa: {ratio(p.y)}</div>
                              <div>Expected: {ratio(p.expected_compa)}</div>
                              <div>Pay: {money(p.base_salary)}</div>
                              <div>Flight: {p.flight_risk ?? "—"}</div>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={scatterData}>
                        {scatterData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={FLAG_COLOR[entry.equity_flag || "missing"] || "#94a3b8"}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <h2 className="text-sm font-semibold text-slate-900">Top raise targets</h2>
                <ul className="mt-3 divide-y divide-slate-100">
                  {(audit.top_raise_targets || []).slice(0, 6).map((t, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.job_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-rose-700">
                          {money(t.recommended_increase)}
                        </p>
                        <p className="text-xs text-slate-500">gap {money(t.gap_to_mid)}</p>
                      </div>
                    </li>
                  ))}
                  {!audit.top_raise_targets?.length && (
                    <li className="py-2 text-sm text-slate-500">No targets flagged.</li>
                  )}
                </ul>
              </Card>

              <Card>
                <h2 className="text-sm font-semibold text-slate-900">Flight risk band</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Critical", audit.flight_risk_summary?.critical],
                    ["High", audit.flight_risk_summary?.high],
                    ["Moderate", audit.flight_risk_summary?.moderate],
                    ["Low", audit.flight_risk_summary?.low],
                  ].map(([label, n]) => (
                    <div key={String(label)} className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="font-semibold tabular-nums">{n ?? 0}</p>
                    </div>
                  ))}
                </div>
                <ul className="mt-3 space-y-2">
                  {(audit.top_flight_risks || []).slice(0, 4).map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-800">{r.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          RISK_PILL[r.flight_risk_band || "low"] || RISK_PILL.low
                        }`}
                      >
                        {r.flight_risk_band} · {r.flight_risk}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}

      {remediation?.summary && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Merit allocation</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Pool" value={money(remediation.summary.merit_pool)} />
            <Stat label="Allocated" value={money(remediation.summary.allocated)} tone="good" />
            <Stat label="Remaining" value={money(remediation.summary.remaining)} />
            <Stat
              label="Employees funded"
              value={String(remediation.summary.employees_funded ?? "—")}
              tone="good"
            />
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Allocated</th>
                    <th className="px-4 py-3 font-medium">Increase</th>
                    <th className="px-4 py-3 font-medium">New base</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(remediation.allocations || []).slice(0, 40).map((a, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.job_title}</p>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{money(a.allocated)}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {a.increase_pct != null ? `${a.increase_pct.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{money(a.new_base_salary)}</td>
                      <td className="px-4 py-2.5 capitalize text-slate-600">
                        {a.flight_risk_band || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
    </ModuleGate>
  );
}
