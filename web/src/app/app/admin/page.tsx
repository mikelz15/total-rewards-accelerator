"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { Button, Card } from "@/components/ModuleShell";
import { roleLabel } from "@/lib/permissions";

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
  const [orgsLoaded, setOrgsLoaded] = useState(false);
  const [licenseOrg, setLicenseOrg] = useState("");
  const [licenseRole, setLicenseRole] = useState("member");
  const [licenseStart, setLicenseStart] = useState("");
  const [licenseEnd, setLicenseEnd] = useState("");
  const [licenseEmail, setLicenseEmail] = useState("");
  const [licenseBusy, setLicenseBusy] = useState(false);

  async function load() {
    try {
      const token = await getAccessToken();
      const me = await saasApi.adminMe(token);
      setAllowed(me.is_system_admin);
      if (!me.is_system_admin) return;
      const data = await saasApi.adminOrgs(token);
      setOrgs(data.orgs);
      setModules(data.modules);
    } finally {
      setOrgsLoaded(true);
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, []);

  async function issueLicense(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLicenseBusy(true);
    try {
      const token = await getAccessToken();
      const orgId = licenseOrg || orgs[0]?.id;
      if (!orgId) throw new Error("Pick a workspace.");
      const issued = await saasApi.adminIssueLicense(token, orgId, {
        role: licenseRole,
        starts_at: new Date(licenseStart).toISOString(),
        ends_at: new Date(licenseEnd).toISOString(),
        email: licenseEmail.trim() || null,
      });
      setInfo(issued.note);
      setLicenseEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the license");
    } finally {
      setLicenseBusy(false);
    }
  }

  async function sitAs(role: string) {
    setError(null);
    setInfo(null);
    try {
      const token = await getAccessToken();
      const seat = await saasApi.adminSitAs(token, role);
      setInfo(`You are sitting as ${roleLabel(seat.role)}. Opening that home.`);
      window.location.assign("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch seats");
    }
  }

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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Platform control plane
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          This is <strong>your</strong> operator console (not a customer screen). Grant pilot/suite
          plans, issue a seat license, suspend an org, and adjust row limits. A customer
          workspace cannot add a seat.
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
          Customers cannot add a seat. Issue a license here first. It has a start and an end.
          A person already in the workspace can still change doors on Team.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Issue a seat license</h2>
        <p className="mt-2 text-sm text-slate-600">
          The license comes first. It has a start and an end. An email opens the passage
          for that one person. It does not put them in the workspace until they accept,
          and only while the window is open.
        </p>
        <form onSubmit={(e) => void issueLicense(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            Workspace
            <select
              value={licenseOrg || orgs[0]?.id || ""}
              onChange={(e) => setLicenseOrg(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Seat
            <select
              value={licenseRole}
              onChange={(e) => setLicenseRole(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1"
            >
              {["owner", "admin", "member", "ta", "hrbp", "executive", "viewer"].map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Starts
            <input
              type="datetime-local"
              required
              value={licenseStart}
              onChange={(e) => setLicenseStart(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="text-sm text-slate-700">
            Ends
            <input
              type="datetime-local"
              required
              value={licenseEnd}
              onChange={(e) => setLicenseEnd(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Email, if the passage should open now
            <input
              type="email"
              value={licenseEmail}
              onChange={(e) => setLicenseEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1"
            />
          </label>
          <div>
            <Button type="submit" disabled={licenseBusy || !orgs.length}>
              {licenseBusy ? "Issuing…" : "Issue license"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Sit as a seat</h2>
        <p className="mt-2 text-sm text-slate-600">
          This changes your seat in this workspace so you can film the home. Admin stays on the
          bar. Sit back as Owner when the shot is done. It does not invite anyone and it does not
          touch another workspace.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["owner", "member", "ta", "hrbp", "executive", "viewer"].map((role) => (
            <Button key={role} type="button" onClick={() => void sitAs(role)}>
              {roleLabel(role)}
            </Button>
          ))}
        </div>
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
                    {allowed === null || !orgsLoaded ? "Loading…" : "No organizations yet."}
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
