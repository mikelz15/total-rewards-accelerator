"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { CLIENT_DOORS } from "@/lib/paths";
import { roleLabel } from "@/lib/permissions";
import { Card } from "@/components/ModuleShell";

function TeamInner() {
  const search = useSearchParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof saasApi.team>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    const token = await getAccessToken();
    setData(await saasApi.team(token));
  }

  useEffect(() => {
    const accept = search.get("accept");
    (async () => {
      try {
        if (accept) {
          const token = await getAccessToken();
          await saasApi.acceptInvite(token, accept);
          setInfo("Invite accepted. You are on that workspace.");
        }
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load team");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeRole(userId: string, newRole: string) {
    setError(null);
    try {
      const token = await getAccessToken();
      await saasApi.updateMemberRole(token, userId, newRole);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(userId: string) {
    if (!confirm("Remove this person from the workspace?")) return;
    try {
      const token = await getAccessToken();
      await saasApi.removeMember(token, userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  }

  const canManage =
    data?.you.role === "owner" || data?.you.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Settings · Team
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          People &amp; roles
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          A person already here can change doors. A new seat is not added from this page.
          The platform issues a license first. That license has a start and an end.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {info && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{info}</p>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Four doors</h2>
        <p className="mt-2 text-sm text-slate-600">
          Rewards is one door. Owner, Admin, and Member share it. A new seat is issued from the platform, and only when a license is already open.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CLIENT_DOORS.map((door) => (
            <div key={door.title} className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="font-medium text-slate-900">{door.title}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {door.keys.map((key) => (
                  <li key={key.role}>
                    <span className="text-slate-900">{key.name}.</span> {key.note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.members || []).map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">
                    {m.email || m.user_id.slice(0, 8) + "…"}
                    {m.user_id === data?.you.user_id ? " (you)" : ""}
                  </p>
                </td>
                <td className="px-5 py-3">
                  {canManage && m.user_id !== data?.you.user_id ? (
                    <select
                      value={m.role}
                      onChange={(e) => void changeRole(m.user_id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1"
                    >
                      {(data?.roles || []).map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{roleLabel(m.role)}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {canManage && m.user_id !== data?.you.user_id ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-rose-700 hover:underline"
                      onClick={() => void remove(m.user_id)}
                    >
                      Remove
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {(data?.invites?.length || 0) > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Pending invites</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {data!.invites.map((i) => (
              <li key={i.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <strong>{i.email}</strong> · {roleLabel(i.role)}
                <div className="mt-1 font-mono text-xs text-slate-500">
                  {i.accept_path || `/app/team?accept=${i.token}`}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading team…</p>}>
      <TeamInner />
    </Suspense>
  );
}
