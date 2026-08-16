"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, saasApi, type DatasetSummary } from "@/lib/saas-api";
import { Card } from "@/components/ModuleShell";

export default function AppDatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await saasApi.listDatasets(token);
        if (!cancelled) setDatasets(res.datasets);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Workspace · Datasets
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Saved cleaned data
          </h1>
          <p className="mt-2 text-slate-600">
            Org-scoped only. Use these as the source for Equity + Merit runs.
          </p>
        </div>
        <Link
          href="/app/cleaner"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Clean new file
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : datasets.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            No datasets yet.{" "}
            <Link href="/app/cleaner" className="font-medium text-teal-800 hover:underline">
              Upload in Cleaner
            </Link>
            .
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Rows</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datasets.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-700">{d.row_count}</td>
                  <td className="px-5 py-3 text-slate-600">{d.source_filename || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {d.created_at ? new Date(d.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href="/app/equity"
                      className="font-medium text-teal-800 hover:underline"
                    >
                      Equity →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
