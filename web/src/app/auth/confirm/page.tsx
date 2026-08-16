"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Handles email links that put tokens in the URL hash (#access_token=...).
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your email…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }

    const run = async () => {
      try {
        const supabase = createClient();
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          setStatus("Email confirmed. Redirecting…");
          router.replace("/app");
          router.refresh();
          return;
        }

        // Maybe already confirmed via ?code= flow or session exists
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/app");
          router.refresh();
          return;
        }

        setError(
          "No session found in this link. Try signing in, or request a new confirmation email from the login page."
        );
        setStatus("Could not finish confirmation");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Confirmation failed");
        setStatus("Could not finish confirmation");
      }
    };

    void run();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <BrandLogo variant="login" href="/" priority />
        <p className="mt-5 text-sm font-medium text-slate-900">{status}</p>
        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        <p className="mt-6 text-sm text-slate-600">
          <Link href="/login" className="font-medium text-teal-800 hover:underline">
            Go to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
