"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ModuleShell";
import { ModuleGate } from "@/components/ModuleGate";
import { getAccessToken, saasApi, type JobMatchResult, type SavedJobMatch } from "@/lib/saas-api";
import { useWorkspace } from "@/lib/workspace-context";

const FAMILIES = [
  { id: "", label: "Let the title decide" },
  { id: "compensation", label: "Compensation" },
  { id: "finance", label: "Finance" },
  { id: "nursing", label: "Nursing" },
  { id: "talent", label: "Talent" },
];

const SAMPLE = {
  title: "Compensation Partner",
  family: "compensation",
  level: "4",
  description: "Own salary structures and place offers against the compensation benchmark.",
  duties: "Own salary structures and pay ranges\nPlace offers against market benchmark\nMatch jobs to survey roles\nSupport annual cycle",
};

function creditLabel(credit: string): string {
  if (credit === "full") return "Full";
  if (credit === "half") return "Half";
  return "None";
}

export default function JobMatchPage() {
  const { permissions } = useWorkspace();
  const [title, setTitle] = useState(SAMPLE.title);
  const [family, setFamily] = useState(SAMPLE.family);
  const [level, setLevel] = useState(SAMPLE.level);
  const [description, setDescription] = useState(SAMPLE.description);
  const [duties, setDuties] = useState(SAMPLE.duties);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [saved, setSaved] = useState<SavedJobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await saasApi.listJobMatches(token);
        if (!cancelled) setSaved(res.matches);
      } catch {
        /* The list appears after the first confirm. A miss here is not the form. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function internalBody() {
    const parsed = Number(level);
    return {
      title: title.trim(),
      family: family || undefined,
      level: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
      description,
      duties: duties
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  async function run(confirm: boolean) {
    if (!title.trim()) {
      setError("The internal job needs a title.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await saasApi.jobMatch(token, { internal: internalBody(), confirm });
      setResult(data);
      if (confirm) {
        const list = await saasApi.listJobMatches(token);
        setSaved(list.matches);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Job Match failed");
    } finally {
      setLoading(false);
    }
  }

  const canWrite = Boolean(permissions?.can_write);

  return (
    <ModuleGate module="job_match" permissions={permissions}>
      <div className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Workspace · Job Match
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            One internal job. Three external matches.
          </h1>
          <p className="mt-2 text-slate-600">
            The match uses the description, the duties, the family, and the level. Title is not
            enough. Same family and level is full. Same family, different level, is half. A
            different family is dropped. Included with Cleaner or Equity. The catalog is a short
            sample we wrote. Survey books and market rates stay out.
          </p>
        </div>

        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-700">
              Internal title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Family
              <select
                value={family}
                onChange={(event) => setFamily(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                {FAMILIES.map((item) => (
                  <option key={item.id || "infer"} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-700">
              Level
              <input
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm text-slate-700 sm:col-span-2">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm text-slate-700 sm:col-span-2">
              Duties, one on each line
              <textarea
                value={duties}
                onChange={(event) => setDuties(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => run(false)} disabled={loading}>
              {loading ? "Matching…" : "Match"}
            </Button>
            {canWrite ? (
              <Button
                variant="secondary"
                onClick={() => run(true)}
                disabled={loading}
              >
                Confirm
              </Button>
            ) : (
              <p className="self-center text-sm text-slate-500">This seat can read. It cannot confirm.</p>
            )}
          </div>
        </Card>

        {result ? (
          <div className="grid gap-3 md:grid-cols-3">
            {result.matches.map((row, index) => (
              <Card key={`${row.code || "open"}-${index}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  {row.title ? creditLabel(row.credit) : "Open"}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {row.title || "No additional match"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{row.reason}</p>
                {row.title ? (
                  <p className="mt-3 text-sm tabular-nums text-slate-500">
                    {row.family || "—"} · level {row.level ?? "—"} · overlap {Math.round(row.overlap * 100)}%
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}

        {result ? (
          <p className="text-sm text-slate-600">
            Overall match {Math.round(result.overall_match * 100)}%.
            {result.stored ? " Saved to this account." : " Not saved yet."}
          </p>
        ) : null}

        {saved.length > 0 ? (
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Confirmed</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {saved.map((row) => (
                <li key={row.id} className="py-3 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{row.title}</span>
                  <span className="ml-2 tabular-nums text-slate-500">
                    {row.overall_match == null ? "" : `${Math.round(row.overall_match * 100)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </ModuleGate>
  );
}
