"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { Button, Card } from "@/components/ModuleShell";

/**
 * System admin console — Mikéz platform operators only.
 * Controlled by SYSTEM_ADMIN_EMAILS on the API (default: mikez.lopez15@gmail.com).
 */
export default function PlatformAdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [orgs, setOrgs] = useState<
    Awaited<ReturnType<typeof saasApi.adminOrgs>>["orgs"]
  >([]);
  const [modules, setModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    const token = await getAccessToken();
    const me = await saasApi.adminMe(token);
    setAllowed(me.is_system_admin);
    if (!me.is_system_admin) return;
    const data = await saasApi.adminOrgs(token);
    setOrgs(data.orgs);
    setModules(data.modules);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  async function setPlan(orgId: string, plan: string) {
    setError(null);
    try {
      const token = await getAccessToken();
      await saasApi.adminPatchOrg(token, orgId, { plan, entitlements: null });
      setInfo(`Updated plan → ${plan}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function toggleSuspend(orgId: string, suspended: boolean) {
    try {
      const token = await getAccessToken();
      await saasApi.adminPatchOrg(token, orgId, { suspended });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (allowed === false) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-slate-900">Platform admin</h1>
        <p className="mt-2 text-sm text-slate-600">
          You are not a system admin. This console is only for Mikéz operators (emails in{" "}
          <code className="text-xs">SYSTEM_ADMIN_EMAILS</code>).
        </p>
        <Link href="/app" className="mt-4 inline-block text-sm font-medium text-teal-800">
          Back to workspace
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
          System admin console
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Platform control plane
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          This is <strong>your</strong> operator console (not a customer screen). Grant pilot/suite
          licenses, suspend abusive orgs, and adjust row limits — without Stripe when needed.
          Customers still manage their own team roles under <strong>Team</strong>.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {info && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{info}</p>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">What you control here</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Commercial plan / module entitlements per organization</li>
          <li>Suspend / reinstate access</li>
          <li>Upload row limits for pilots</li>
          <li>Visibility into member &amp; dataset counts (support)</li>
        </ul>
        <p className="mt-3 text-sm text-slate-500">
          Customers control invites and roles (owner/admin/member/ta/viewer) themselves.
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Modules</th>
                <th className="px-4 py-3 font-medium">Seats / data</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map((o) => (
                <tr key={o.id} className={o.suspended ? "bg-rose-50/40" : undefined}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{o.name}</p>
                    <p className="text-xs text-slate-500">{o.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.plan}
                      onChange={(e) => void setPlan(o.id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1"
                    >
                      {[
                        "trial",
                        "pilot",
                        "suite",
                        "starter",
                        "cleaner",
                        "equity",
                        "tracker",
                        "closer",
                        "ta_pack",
                        "none",
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {o.suspended && (
                      <span className="ml-2 text-xs font-semibold text-rose-700">SUSPENDED</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(o.effective_modules || []).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {o.member_count} · {o.dataset_count} ds · {o.max_upload_rows} rows
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => void toggleSuspend(o.id, !o.suspended)}
                    >
                      {o.suspended ? "Reinstate" : "Suspend"}
                    </Button>
                    <Button variant="secondary" onClick={() => void setPlan(o.id, "suite")}>
                      Grant suite
                    </Button>
                    <Button variant="ghost" onClick={() => void setPlan(o.id, "pilot")}>
                      Pilot
                    </Button>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {allowed === null ? "Loading…" : "No organizations yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modules.length > 0 && (
        <p className="text-xs text-slate-500">Module catalog: {modules.join(", ")}</p>
      )}
    </div>
  );
}
