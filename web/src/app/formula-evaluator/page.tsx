"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, ModuleShell } from "@/components/ModuleShell";

type FormulaIssue = {
  code: string;
  severity: string;
  title: string;
  explanation: string;
  suggested_action: string;
  affected_count: number;
};

type FormulaEvaluatorResult = {
  logic_health_score: number;
  row_count: number;
  issue_count: number;
  issues?: FormulaIssue[];
  disclaimer?: string;
};

export default function FormulaEvaluatorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormulaEvaluatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/formula-evaluator/run", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Run failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModuleShell
      eyebrow="New Module"
      title="Formula Evaluator"
      description="Upload a merit or bonus file. Get ranked flags for data, logic, and equity issues in under a minute. First-pass screening, not a legal determination."
    >
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Upload CSV or XLSX</span>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="mt-1 block text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <Button disabled={!file || loading} onClick={handleRun}>
            {loading ? "Running…" : "Run evaluator"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <div className="text-xs uppercase text-slate-500">Logic Health</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900">
                {result.logic_health_score}
              </div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-slate-500">Rows</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900">{result.row_count}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-slate-500">Issues</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900">{result.issue_count}</div>
            </Card>
          </div>

          <div className="space-y-3">
            {result.issues?.map((issue: FormulaIssue) => (
              <Card key={issue.code}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        issue.severity === "Critical"
                          ? "bg-rose-100 text-rose-700"
                          : issue.severity === "High"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <h3 className="mt-2 font-semibold text-slate-900">{issue.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{issue.explanation}</p>
                    <p className="mt-2 text-sm text-slate-700">{issue.suggested_action}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">{issue.affected_count} rows</div>
                </div>
              </Card>
            ))}
          </div>

          <p className="text-xs text-slate-500">{result.disclaimer}</p>
        </div>
      )}

      <p className="mt-8 text-sm text-slate-500">
        Want the offline template version? See the <Link href="/store" className="underline">Store</Link>.
      </p>
    </ModuleShell>
  );
}
