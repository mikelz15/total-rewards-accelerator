"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { money } from "@/lib/format";
import { Button, Card, Stat } from "@/components/ModuleShell";
import { ModuleGate } from "@/components/ModuleGate";
import { useWorkspace } from "@/lib/workspace-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const STAGES = ["sourced", "screen", "interview", "offer", "accepted", "declined", "withdrawn"];

type Candidate = {
  id: string;
  name: string;
  role: string;
  stage: string;
  base_salary: number;
  target_bonus_pct?: number;
  lti_target_value?: number;
  company_name?: string;
};

export default function AppCandidatesPage() {
  const { permissions } = useWorkspace();
  const [rows, setRows] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [base, setBase] = useState(100000);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const t = await getAccessToken();
    const res = await saasApi.listCandidates(t);
    setRows((res.candidates as Candidate[]) || []);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const t = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/v1/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          name,
          role: role || "Role TBD",
          stage: "sourced",
          base_salary: base,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || res.statusText);
      }
      setName("");
      setRole("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStage(id: string, stage: string) {
    setError(null);
    try {
      const t = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/v1/candidates/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || res.statusText);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  const byStage = STAGES.reduce(
    (acc, s) => {
      acc[s] = rows.filter((r) => r.stage === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <ModuleGate module="tracker" permissions={permissions}>
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace · Candidates
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Candidate tracker
        </h1>
        <p className="mt-2 text-slate-600">
          Org-scoped pipeline that survives restarts — open any offer stage in Closer for total
          wealth.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={String(rows.length)} />
        <Stat label="In interview" value={String(byStage.interview || 0)} tone="warn" />
        <Stat label="Offer" value={String(byStage.offer || 0)} tone="good" />
        <Stat label="Accepted" value={String(byStage.accepted || 0)} tone="good" />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Add candidate</h2>
        <form onSubmit={onCreate} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[10rem] flex-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="min-w-[10rem] flex-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Compensation Analyst"
            />
          </label>
          <label className="w-36">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Base</span>
            <input
              type="number"
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={busy || !name}>
            Add
          </Button>
        </form>
        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Base</th>
                <th className="px-5 py-3 font-medium">Closer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No candidates yet — add your first above.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-5 py-3 text-slate-700">{c.role}</td>
                    <td className="px-5 py-3">
                      <select
                        value={c.stage}
                        onChange={(e) => void setStage(c.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm capitalize"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-700">
                      {money(Number(c.base_salary || 0))}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/app/closer`}
                        onClick={() => {
                          // Closer page loads pipeline chips; stage offer is enough
                        }}
                        className="font-medium text-teal-800 hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    </ModuleGate>
  );
}
