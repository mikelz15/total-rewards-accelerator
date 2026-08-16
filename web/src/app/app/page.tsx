"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saasApi, type DatasetSummary, type MeResponse } from "@/lib/saas-api";
import { Card, Stat } from "@/components/ModuleShell";

const modules = [
  {
    href: "/app/cleaner",
    step: "01",
    title: "Cleaner",
    body: "Upload HRIS → clean → save an org-scoped dataset for equity and merit.",
    accent: "border-t-blue-500",
  },
  {
    href: "/app/equity",
    step: "02",
    title: "Equity + Merit",
    body: "Dual-lens equity, flight risk, and merit pool remediation on saved data.",
    accent: "border-t-teal-600",
  },
  {
    href: "/app/candidates",
    step: "03",
    title: "Candidates",
    body: "Persistent recruiting pipeline — hand off packages into Closer.",
    accent: "border-t-violet-500",
  },
  {
    href: "/app/closer",
    step: "04",
    title: "Closer",
    body: "Four-year total wealth projection and one-page offer PDF.",
    accent: "border-t-rose-500",
  },
];

export default function AppDashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const [profile, ds, cand] = await Promise.all([
          saasApi.me(token),
          saasApi.listDatasets(token).catch(() => ({ datasets: [] as DatasetSummary[] })),
          saasApi.listCandidates(token).catch(() => ({ candidates: [] as unknown[] })),
        ]);
        if (!cancelled) {
          setMe(profile);
          setDatasets(ds.datasets);
          setCandidateCount(cand.candidates?.length ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {me ? `Welcome back${me.user.email ? `, ${me.user.email.split("@")[0]}` : ""}` : "Your workspace"}
        </h1>
        <p className="mt-2 text-slate-600">
          Authenticated Total Rewards Accelerator — durable datasets, equity runs, and offer tools
          for your organization. Public sample demo stays at{" "}
          <Link href="/" className="font-medium text-teal-800 hover:underline">
            the marketing site
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Organization" value={loading ? "…" : me?.org.name || "—"} />
        <Stat
          label="Plan · row limit"
          value={
            loading
              ? "…"
              : `${me?.org.plan || "—"} · ${(me?.org.max_upload_rows ?? 0).toLocaleString()}`
          }
        />
        <Stat
          label="Datasets · candidates"
          value={loading ? "…" : `${datasets.length} · ${candidateCount}`}
          tone="good"
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          End-to-end modules
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`rounded-2xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm transition hover:shadow-md ${m.accent}`}
            >
              <p className="text-[10px] font-semibold tracking-widest text-teal-700">{m.step}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.body}</p>
              <p className="mt-3 text-sm font-medium text-teal-800">Open →</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Recent datasets</h2>
            <Link href="/app/datasets" className="text-sm font-medium text-teal-800 hover:underline">
              View all
            </Link>
          </div>
          {datasets.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No datasets yet.{" "}
              <Link href="/app/cleaner" className="font-medium text-teal-800 hover:underline">
                Clean &amp; save one
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {datasets.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{d.name}</p>
                    <p className="text-slate-500">
                      {d.row_count} rows
                      {d.source_filename ? ` · ${d.source_filename}` : ""}
                    </p>
                  </div>
                  <Link
                    href="/app/equity"
                    className="shrink-0 font-medium text-teal-800 hover:underline"
                  >
                    Equity →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Suggested path</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                1
              </span>
              Clean an HRIS export and save it to your org.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                2
              </span>
              Run equity + flight risk, then allocate a merit pool.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                3
              </span>
              Track candidates and close offers with a four-year wealth PDF.
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/app/cleaner"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Start with Cleaner
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Pricing
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
