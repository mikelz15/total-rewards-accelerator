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

  async function setStage(c: Candidate, stage: string) {
    setLoading(true);
    setError(null);
    try {
      await api.candidatesUpdate(c.id, { stage });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stage update failed");
      setLoading(false);
    }
  }

  return (
    <ModuleShell
      eyebrow="Module 03"
      title="Candidate Tracker"
      description="Recruiting pipeline tracker — separate from Candidate Closer (wealth PDF). Track stages, offer packages, and jump into Closer to generate a total-wealth statement."
    >
      <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3 text-sm text-violet-950">
        <p className="font-semibold">Sample data only (public demo)</p>
        <p className="mt-1 text-violet-900/90">
          Synthetic recruiting pipeline only. Creating or deleting candidates is disabled. Move
          stages to explore the flow, then open a sample offer in Closer. Do not enter real candidate
          PII.
        </p>
      </div>

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
          <h2 className="text-sm font-semibold text-slate-900">Demo pipeline</h2>
          <p className="mt-2 text-sm text-slate-600">
            Seeded personas illustrate stage tracking and Closer handoff. Full create / edit /
            import unlocks on a design-partner pilot or paid module.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>· Stages: sourced → screen → interview → offer → accepted</li>
            <li>· Offer package fields feed four-year wealth in Closer</li>
            <li>· Placement Engine available when ranges + YOE are set in Closer</li>
          </ul>
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
                      {money(c.base_salary)} base · {c.target_bonus_pct}% bonus · LTI{" "}
                      {money(c.lti_target_value)}
                    </div>
                    {c.notes && <p className="mt-1 text-xs text-slate-500">{c.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      value={c.stage}
                      disabled={loading}
                      onChange={(e) => setStage(c, e.target.value)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Link
                      href={`/closer?name=${encodeURIComponent(c.name)}&role=${encodeURIComponent(c.role)}&base=${c.base_salary}&bonus=${c.target_bonus_pct}&lti=${c.lti_target_value}`}
                      className="text-xs font-medium text-teal-700 hover:underline"
                    >
                      Open in Closer →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
            {!data?.candidates?.length && (
              <li className="px-5 py-8 text-sm text-slate-500">
                {loading ? "Loading sample pipeline…" : "No candidates yet."}
              </li>
            )}
          </ul>
        </Card>
      </div>
    </ModuleShell>
  );
}
