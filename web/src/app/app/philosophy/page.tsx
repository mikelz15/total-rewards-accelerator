"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PhilosophyBoard } from "@/components/PhilosophyBoard";
import { Button, Card } from "@/components/ModuleShell";
import { ModuleGate } from "@/components/ModuleGate";
import type { PhilosophyResult } from "@/lib/api";
import { getAccessToken, saasApi, type DatasetSummary } from "@/lib/saas-api";
import { useWorkspace } from "@/lib/workspace-context";

export default function AppPhilosophyPage() {
  const { permissions } = useWorkspace();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [marketLow, setMarketLow] = useState("0.97");
  const [marketHigh, setMarketHigh] = useState("1.03");
  const [deptCap, setDeptCap] = useState("0.08");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhilosophyResult | null>(null);

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

  async function run() {
    if (!datasetId) {
      setError("Save a dataset from Cleaner first.");
      return;
    }
    const low = Number(marketLow);
    const high = Number(marketHigh);
    const cap = Number(deptCap);
    if (![low, high, cap].every((n) => Number.isFinite(n)) || low >= high) {
      setError("The midpoint low end has to sit below the high end.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await saasApi.philosophyRun(token, {
        dataset_id: datasetId,
        market_low: low,
        market_high: high,
        dept_log_cap: cap,
        save: true,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Philosophy check failed");
    } finally {
      setLoading(false);
    }
  }

  const selected = datasets.find((d) => d.id === datasetId);

  return (
    <ModuleGate module="equity" permissions={permissions}>
      <div className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Workspace · Philosophy Check
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Does this file match what you said you pay for?
          </h1>
          <p className="mt-2 text-slate-600">
            Same three claims as the public sample. This run uses a saved dataset and keeps the
            score with the organization. There is no ten-row cap.
          </p>
        </div>

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end">
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
            <label className="block text-xs font-medium text-slate-600">
              Midpoint low
              <input
                value={marketLow}
                onChange={(e) => setMarketLow(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Midpoint high
              <input
                value={marketHigh}
                onChange={(e) => setMarketHigh(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Department cap
              <input
                value={deptCap}
                onChange={(e) => setDeptCap(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
              />
            </label>
            <Button disabled={loading || !datasetId} onClick={run}>
              {loading ? "Scoring…" : "Score this file"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {selected
              ? `${selected.row_count} rows · ${selected.source_filename || "saved dataset"}`
              : "Run Cleaner in the workspace to save a dataset."}
            {" · "}
            <Link href="/app/cleaner" className="font-medium text-teal-800 hover:underline">
              Open Cleaner
            </Link>
            {" · "}
            <Link href="/philosophy" className="font-medium text-teal-800 hover:underline">
              Public sample
            </Link>
          </p>
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        </Card>

        {result && <PhilosophyBoard data={result} />}
      </div>
    </ModuleGate>
  );
}
