"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, CleanResult } from "@/lib/api";
import { loadCleanResult, saveCleanResult } from "@/lib/session";
import { downloadCsv, stamp } from "@/lib/export";
import { money, ratio } from "@/lib/format";
import { Button, Card, ModuleShell, Stat } from "@/components/ModuleShell";

const PREVIEW_COLS = [
  "employee_id",
  "name",
  "job_title",
  "base_salary",
  "range_mid",
  "years_experience",
  "education",
  "expected_rate",
  "placement_gap",
  "placement_flag",
  "actual_compa",
];

export default function CleanerPage() {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<CleanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(loadCleanResult());
  }, []);

  async function run(action: () => Promise<CleanResult>) {
    setLoading(true);
    setError(null);
    try {
      const data = await action();
      setResult(data);
      saveCleanResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function exportCleaned() {
    if (!result?.records?.length) return;
    const cols =
      result.stats.canonical_columns?.length > 0
        ? result.stats.canonical_columns
        : Object.keys(result.records[0]);
    downloadCsv(`tra_cleaned_${stamp()}.csv`, result.records, cols);
  }

  const previewCols = result
    ? PREVIEW_COLS.filter(
        (c) =>
          result.stats.canonical_columns?.includes(c) ||
          result.records.some((r) => r[c] != null)
      )
    : [];

  return (
    <ModuleShell
      eyebrow="Module 01"
      title="Market Data Cleaner"
      description="Built for real HRIS exports — including years of experience and education. Maps pay ranges, then runs the shared Placement Engine (wage-calc mindset) so Auditor, Merit, Flight Risk, and Closer all share one expected-rate model."
    >
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Public demo — data policy</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-900/90">
          <li>
            Custom uploads / paste: max <strong>10 data rows</strong>,{" "}
            <strong>5 per IP per week</strong>
          </li>
          <li>
            Headers scanned for sensitive fields (SSN, DOB, address, phone, email, MRN, etc.)
          </li>
          <li>
            Prefer <strong>Load messy HRIS sample</strong> — do not upload real employee files
          </li>
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">1. Import data</h2>
          <p className="mt-1 text-sm text-slate-500">
            Handles metadata rows, BOM, tab/CSV, $, text performance ratings, hourly vs annual, and terminated status.
            Use <strong>Reset demo</strong> in the nav anytime for a fresh sample path. Demo: first 10 rows only.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => run(() => api.cleanerSample())}
            >
              {loading ? "Cleaning…" : "Load messy HRIS sample"}
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Upload CSV / TSV (≤10 rows)
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) run(() => api.cleanerUpload(file));
                }}
              />
            </label>
          </div>

          <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Or paste export
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            placeholder="Worker ID,Legal Name,Business Title,Total Base Pay Annualized,..."
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
          <div className="mt-3">
            <Button
              disabled={loading || !csvText.trim()}
              onClick={() => run(() => api.cleanerPaste(csvText))}
            >
              Clean pasted data
            </Button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">2. Cleaning results</h2>
          {!result ? (
            <p className="mt-6 text-sm text-slate-500">
              Quality score, source-system guess, column map, and issues appear here after clean.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Rows in → out" value={`${result.stats.rows_in} → ${result.stats.rows_out}`} />
                <Stat
                  label="Quality score"
                  value={String(result.stats.quality_score ?? "—")}
                  tone={(result.stats.quality_score ?? 0) >= 70 ? "good" : "warn"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Source guess"
                  value={result.stats.source_system_guess || "generic"}
                />
                <Stat
                  label="Dropped inactive"
                  value={String(result.stats.dropped_inactive ?? 0)}
                />
              </div>
              {result.stats.placement && (
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label="Below expected placement"
                    value={String(result.stats.placement.below_expected)}
                    tone="warn"
                  />
                  <Stat
                    label="Placement gap $"
                    value={
                      result.stats.placement.total_placement_gap != null
                        ? `$${Math.round(result.stats.placement.total_placement_gap).toLocaleString()}`
                        : "—"
                    }
                    tone="warn"
                  />
                </div>
              )}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Column mapping
                </p>
                <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-sm">
                  {Object.entries(result.stats.columns_mapped).map(([from, to]) => (
                    <li key={from} className="flex items-center gap-2 text-slate-700">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{from}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium text-teal-800">{to}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.issues.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Issues</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm">
                    {result.issues.map((issue, i) => (
                      <li
                        key={i}
                        className={
                          issue.level === "error"
                            ? "text-rose-700"
                            : issue.level === "info"
                              ? "text-slate-600"
                              : "text-amber-700"
                        }
                      >
                        [{issue.level}] {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={exportCleaned}>
                  Export cleaned CSV
                </Button>
                <Link
                  href="/auditor"
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  3. Pay Equity + Merit Pool →
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      {result?.stats.placement && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Placement engine (wage-calc)
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                YOE + education → expected rate in range. Shared with Auditor, Merit, Flight Risk, and Closer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Below expected"
                value={String(result.stats.placement.below_expected)}
                tone="warn"
              />
              <Stat
                label="At expected"
                value={String(result.stats.placement.at_expected)}
                tone="good"
              />
              <Stat
                label="Above expected"
                value={String(result.stats.placement.above_expected)}
              />
              <Stat
                label="Total placement gap"
                value={money(result.stats.placement.total_placement_gap)}
                tone="warn"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Avg expected compa"
              value={ratio(result.stats.placement.avg_expected_compa)}
            />
            <Stat
              label="Avg actual (mid) compa"
              value={ratio(result.stats.placement.avg_actual_compa)}
            />
          </div>
        </Card>
      )}

      {result && result.records.length > 0 && (
        <Card className="mt-6 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Preview (first 10) · placement columns highlighted
            </h2>
            <Button variant="ghost" onClick={exportCleaned}>
              Download full cleaned CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {(previewCols.length ? previewCols : result.stats.canonical_columns.slice(0, 9)).map(
                    (col) => (
                      <th
                        key={col}
                        className={`px-4 py-2 font-medium ${
                          ["expected_rate", "placement_gap", "placement_flag", "years_experience", "education"].includes(
                            col
                          )
                            ? "bg-teal-50 text-teal-800"
                            : ""
                        }`}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {result.records.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {(previewCols.length
                      ? previewCols
                      : result.stats.canonical_columns.slice(0, 9)
                    ).map((col) => (
                      <td
                        key={col}
                        className={`px-4 py-2 tabular-nums text-slate-700 ${
                          col === "placement_flag" && row[col] === "below_expected"
                            ? "font-medium text-amber-800"
                            : ""
                        }`}
                      >
                        {formatCell(row[col], col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </ModuleShell>
  );
}

function formatCell(value: unknown, col?: string): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (
      col &&
      (col.includes("salary") ||
        col.includes("rate") ||
        col.includes("gap") ||
        col.includes("mid") ||
        col.includes("min") ||
        col.includes("max"))
    ) {
      return money(value);
    }
    if (col?.includes("compa")) return ratio(value);
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}
