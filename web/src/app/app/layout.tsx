"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { saasApi, type MeResponse } from "@/lib/saas-api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
        if (!cancelled) {
          setMe(profile);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load workspace");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav orgName={me?.org.name} email={me?.user.email} />
      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong className="font-semibold">Workspace note:</strong> {error}
            {(error.includes("SaaS mode is offline") ||
              error.includes("not configured") ||
              error.includes("Failed to fetch")) && (
              <span className="mt-1 block text-amber-800">
                Confirm API SaaS env (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) and web
                Supabase keys. See <code className="text-xs">docs/SAAS-ROADMAP.md</code>.
              </span>
            )}
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
