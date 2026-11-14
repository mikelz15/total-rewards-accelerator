"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/ModuleShell";
import { useWorkspace } from "@/lib/workspace-context";
import { saasApi, type DatasetSummary, type WorkbookItem } from "@/lib/saas-api";
import { createClient } from "@/lib/supabase/client";

const SEAT_FOR_ROLE: Record<string, string> = {
  owner: "rewards",
  admin: "rewards",
  member: "rewards",
  viewer: "rewards",
  ta: "talent",
  hrbp: "hrbp",
  executive: "executive",
};

const SEAT_LABEL: Record<string, string> = {
  rewards: "Rewards",
  talent: "Talent",
  hrbp: "HRBP",
  executive: "Executive",
};

export default function WorkbookPage() {
  const { me, permissions } = useWorkspace();
  const seat = SEAT_FOR_ROLE[me?.membership.role || ""] || "rewards";
  const canWrite = Boolean(permissions?.can_write);
  const [items, setItems] = useState<WorkbookItem[]>([]);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const [book, ds, cand] = await Promise.all([
          saasApi.workbook(token),
          saasApi.listDatasets(token).catch(() => ({ datasets: [] as DatasetSummary[] })),
          saasApi.listCandidates(token).catch(() => ({ candidates: [] as unknown[] })),
        ]);
        if (cancelled) return;
        setItems(book.items);
        setDatasets(ds.datasets);
        setCandidateCount(cand.candidates?.length ?? 0);
        const next: Record<string, string> = {};
        for (const item of book.items) next[item.id] = item.note;
        setDrafts(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open the workbook");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(event: FormEvent, item: WorkbookItem) {
    event.preventDefault();
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const saved = await saasApi.workbookNote(token, item.id, { note: drafts[item.id] || "" });
    setItems((current) => current.map((row) => (row.id === saved.id ? saved : row)));
  }

  const latest = datasets[0];
  const mine = items.filter((item) => item.seat === seat);
  const others = items.filter((item) => item.seat !== seat);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {SEAT_LABEL[seat] || "Chair"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          The file sits next to the steps. A note saved here is the chair’s own, and the other chairs can read it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-slate-500">File</p>
          <p className="mt-1 font-semibold text-slate-900">{latest?.name || "No file yet"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {latest ? `${latest.row_count} rows` : "Rewards has not saved one."}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">Candidates</p>
          <p className="mt-1 font-semibold text-slate-900">{candidateCount}</p>
          <p className="mt-1 text-sm text-slate-600">Talent’s list.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">Workspace rows</p>
          <p className="mt-1 font-semibold text-slate-900">
            {me ? me.org.max_upload_rows.toLocaleString("en-US") : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-600">{me?.org.plan || ""}</p>
        </Card>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Your steps</h2>
        {mine.map((item) => (
          <Card key={item.id}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <span className="text-xs uppercase text-slate-500">{item.status.replace("_", " ")}</span>
            </div>
            {canWrite ? (
              <form className="mt-3 space-y-2" onSubmit={(event) => void save(event, item)}>
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  value={drafts[item.id] ?? ""}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Save note
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-slate-600">{item.note || "No note yet."}</p>
            )}
          </Card>
        ))}
        {mine.length === 0 && <p className="text-sm text-slate-500">No steps for this chair yet.</p>}
      </section>

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Other chairs</h2>
          {others.map((item) => (
            <Card key={item.id}>
              <p className="text-xs uppercase text-slate-500">{SEAT_LABEL[item.seat] || item.seat}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.note || "No note yet."}</p>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
