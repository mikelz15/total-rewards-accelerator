"use client";

import { useEffect, useState } from "react";
import { api, type PhilosophyResult } from "@/lib/api";
import { PhilosophyBoard } from "@/components/PhilosophyBoard";
import { Button, Card, ModuleShell } from "@/components/ModuleShell";

const DEFAULTS = { marketLow: "0.97", marketHigh: "1.03", deptCap: "0.08" };

export default function PhilosophyDemoPage() {
  const [data, setData] = useState<PhilosophyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [marketLow, setMarketLow] = useState(DEFAULTS.marketLow);
  const [marketHigh, setMarketHigh] = useState(DEFAULTS.marketHigh);
  const [deptCap, setDeptCap] = useState(DEFAULTS.deptCap);

  function knobs() {
    const low = Number(marketLow);
    const high = Number(marketHigh);
    const cap = Number(deptCap);
    if (![low, high, cap].every((n) => Number.isFinite(n))) {
      throw new Error("The three claim numbers have to be numbers.");
    }
    if (low >= high) {
      throw new Error("The midpoint low end has to sit below the high end.");
    }
    return { market_low: low, market_high: high, dept_log_cap: cap };
  }

  async function run(job: () => Promise<PhilosophyResult>) {
    setBusy(true);
    setError(null);
    try {
      setData(await job());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Philosophy check failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run(() => api.philosophySample());
    // The first paint is the built-in sample. Later runs are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModuleShell
      eyebrow="Demo · Philosophy Check"
      title="Does the file match what you said you pay for?"
      description="Three claims, written so they can fail. Score them on the sample, or set the bands and run a synthetic file. Custom files stay on the public-demo rules."
    >
      <Card className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          The three claims
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600">
            Midpoint low
            <input
              value={marketLow}
              onChange={(e) => setMarketLow(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Midpoint high
            <input
              value={marketHigh}
              onChange={(e) => setMarketHigh(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Department cap, log points
            <input
              value={deptCap}
              onChange={(e) => setDeptCap(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Performance stays a sign test: the rating coefficient has to be positive after midpoint, tenure, and department.
          A custom file is capped at 10 rows, five runs a week from one address, and headers that look like SSN, email, or phone are refused.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run(() => api.philosophyRun(knobs()))}
          >
            {busy ? "Scoring…" : "Score the sample"}
          </Button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Choose a CSV
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then((text) => setCsvText(text));
              }}
            />
          </label>
        </div>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Or paste a file
        </label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={6}
          placeholder="Employee Name,Department,Annual Salary,Midpoint,Perf Rating,Hire Date"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-teal-600"
        />
        <div className="mt-3">
          <Button
            disabled={busy || !csvText.trim()}
            onClick={() => run(() => api.philosophyRun({ ...knobs(), csv_text: csvText }))}
          >
            Run this file
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      </Card>

      {data ? (
        <PhilosophyBoard data={data} />
      ) : (
        !error && <p className="text-sm text-slate-500">Loading the sample…</p>
      )}
    </ModuleShell>
  );
}
