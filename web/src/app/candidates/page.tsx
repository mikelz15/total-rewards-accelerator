"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Candidate, CandidateList } from "@/lib/api";
import { money } from "@/lib/format";
import { Button, Card, ModuleShell, Stat } from "@/components/ModuleShell";

const STAGES = ["sourced", "screen", "interview", "offer", "accepted", "declined", "withdrawn"];

export default function CandidatesPage() {
  const [data, setData] = useState<CandidateList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    stage: "sourced",
    base_salary: 100000,
    target_bonus_pct: 10,
    lti_target_value: 0,
    notes: "",
  });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setData(await api.candidatesList());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addCandidate() {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await api.candidatesCreate(form);
      setForm({ ...form, name: "", notes: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setLoading(false);
    }
  }

  async function setStage(c: Candidate, stage: string) {
    await api.candidatesUpdate(c.id, { stage });
    await refresh();
  }

  async function remove(c: Candidate) {
    await api.candidatesDelete(c.id);
    await refresh();
  }

  return (
    <ModuleShell
      eyebrow="Module 04"
      title="Candidate Tracker"
      description="Recruiting pipeline tracker — separate from Candidate Closer (wealth PDF). Track stages, offer packages, and jump into Closer to generate a total-wealth statement."
    >
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {data && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total candidates" value={String(data.summary.total)} />
          <Stat label="Open pipeline" value={String(data.summary.open_pipeline)} tone="good" />
          <Stat label="In offer stage" value={String(data.summary.by_stage.offer || 0)} tone="warn" />
          <Stat label="Offer base total" value={money(data.summary.offer_base_total)} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Add candidate</h2>
          <div className="mt-3 space-y-3">
            <input
              className={inputClass}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <select
              className={inputClass}
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="number"
              className={inputClass}
              placeholder="Base salary"
              value={form.base_salary}
              onChange={(e) => setForm({ ...form, base_salary: Number(e.target.value) })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className={inputClass}
                placeholder="Bonus %"
                value={form.target_bonus_pct}
                onChange={(e) => setForm({ ...form, target_bonus_pct: Number(e.target.value) })}
              />
              <input
                type="number"
                className={inputClass}
                placeholder="LTI $"
                value={form.lti_target_value}
                onChange={(e) => setForm({ ...form, lti_target_value: Number(e.target.value) })}
              />
            </div>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <Button disabled={loading} onClick={addCandidate}>
              Add to pipeline
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Pipeline</h2>
            <Button variant="ghost" disabled={loading} onClick={refresh}>
              Refresh
            </Button>
          </div>
          <ul className="divide-y divide-slate-100">
            {(data?.candidates || []).map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-600">{c.role}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {money(c.base_salary)} base · {c.target_bonus_pct}% bonus · LTI {money(c.lti_target_value)}
                    </div>
                    {c.notes && <p className="mt-1 text-xs text-slate-500">{c.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={c.stage}
                      onChange={(e) => setStage(c, e.target.value)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Link
                        href={`/closer?name=${encodeURIComponent(c.name)}&role=${encodeURIComponent(c.role)}&base=${c.base_salary}&bonus=${c.target_bonus_pct}&lti=${c.lti_target_value}`}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        Open in Closer →
                      </Link>
                      <button
                        type="button"
                        className="text-xs text-rose-600 hover:underline"
                        onClick={() => remove(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {!data?.candidates?.length && (
              <li className="px-5 py-8 text-sm text-slate-500">No candidates yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </ModuleShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
