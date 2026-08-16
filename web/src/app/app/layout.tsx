"use client";

import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saasApi, type MeResponse } from "@/lib/saas-api";
import { WorkspaceContext } from "@/lib/workspace-context";
import type { Permissions } from "@/lib/permissions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured on this deployment.");
      return;
    }
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Not signed in");
        return;
      }
      const profile = await saasApi.me(token);
      setMe(profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workspace");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const permissions = (me?.permissions as Permissions | undefined) || null;

  return (
    <WorkspaceContext.Provider
      value={{ me, permissions, error, reload: () => void load() }}
    >
      <div className="min-h-screen bg-slate-50">
        <AppNav
          orgName={me?.org.name}
          email={me?.user.email}
          permissions={permissions}
          isSystemAdmin={Boolean(me?.user.is_system_admin)}
        />
        {error && (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong className="font-semibold">Workspace note:</strong> {error}
            </div>
          </div>
        )}
        {me?.org.suspended && (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              This organization is <strong>suspended</strong>. Contact support.
            </div>
          </div>
        )}
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </div>
    </WorkspaceContext.Provider>
  );
}
