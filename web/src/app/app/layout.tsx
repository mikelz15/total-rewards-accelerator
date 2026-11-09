"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAccessToken, saasApi, type MeResponse } from "@/lib/saas-api";
import { brandImageUrl } from "@/lib/branding";
import { WorkspaceContext } from "@/lib/workspace-context";
import type { Permissions } from "@/lib/permissions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const hasProfile = useRef(false);

  const load = useCallback(async () => {
    // Re-checking the profile on navigation should not flip the whole app back
    // into a loading state (that caused the post-sign-in flicker).
    if (!hasProfile.current) setLoading(true);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured on this deployment.");
      setLoading(false);
      return;
    }
    try {
      // Same short wait-for-session as every page fetch, so the layout and the
      // page agree on whether the user is signed in right after sign-in.
      let token: string;
      try {
        token = await getAccessToken();
      } catch {
        if (!hasProfile.current) setError("Not signed in");
        return;
      }
      const profile = await saasApi.me(token);
      hasProfile.current = true;
      setMe(profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  const permissions = (me?.permissions as Permissions | undefined) || null;

  return (
    <WorkspaceContext.Provider
      value={{ me, permissions, error, loading, reload: () => void load() }}
    >
      <div className="min-h-screen bg-[#e6eef0]">
        <AppNav
          orgName={me?.org.name}
          email={me?.user.email}
          permissions={permissions}
          isSystemAdmin={Boolean(me?.user.is_system_admin)}
          brandImageUrl={brandImageUrl(me?.org.brand_image_path)}
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
