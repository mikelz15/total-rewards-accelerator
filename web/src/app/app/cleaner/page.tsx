"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saasApi } from "@/lib/saas-api";
import { Button, Card, Stat } from "@/components/ModuleShell";

export default function AppCleanerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastRows, setLastRows] = useState<number | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    setDatasetId(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Not signed in");

      setStatus("Cleaning with Placement Engine…");
      const cleaned = await saasApi.cleanerUpload(token, file);
      const rows = cleaned.records?.length ?? 0;
      setLastRows(rows);
      const q = cleaned.stats?.quality_score;
      setQuality(typeof q === "number" ? q : null);

      setStatus("Saving to your organization…");
      const saved = await saasApi.createDataset(token, {
        name: file.name.replace(/\.[^.]+$/, "") || "Cleaned dataset",
        source_filename: file.name,
        records: cleaned.records || [],
        stats: cleaned.stats || {},
        issues: (cleaned.issues as unknown[]) || [],
      });
      setDatasetId(saved.id);
      setDatasetName(saved.name);
      setStatus(`Saved “${saved.name}” (${saved.row_count} rows).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clean failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace · Cleaner
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Market data cleaner
        </h1>
        <p className="mt-2 text-slate-600">
          Messy HRIS → analysis-ready records with org row limits and durable storage. Prefer
          scrubbed files.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Upload CSV</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                HRIS / market file
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-900"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            {status && (
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{status}</p>
            )}
            <Button type="submit" disabled={busy || !file}>
              {busy ? "Working…" : "Clean & save to org"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {lastRows != null && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Cleaned rows" value={String(lastRows)} tone="good" />
              <Stat
                label="Quality score"
                value={quality != null ? String(quality) : "—"}
              />
            </div>
          )}
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Next steps</h2>
            {datasetId ? (
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <p>
                  Dataset <strong className="text-slate-900">{datasetName}</strong> is ready.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/app/equity"
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Run Equity + Merit
                  </Link>
                  <Link
                    href="/app/datasets"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View datasets
                  </Link>
                </div>
              </div>
            ) : (
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
                <li>Upload a CSV export from your HRIS or market tool.</li>
                <li>We map columns, money, dates, and run the Placement Engine.</li>
                <li>Save persists under your organization for Equity + Merit.</li>
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
