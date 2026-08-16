"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/app`
          : undefined;
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });
      if (signError) throw signError;
      if (data.session) {
        router.replace("/app");
        router.refresh();
        return;
      }
      setInfo(
        "Check your email to confirm. Use the link in the message — it should open TRA and land you in your workspace. Then you can sign in."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <BrandLogo variant="login" href="/" priority />
        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Create workspace
        </p>
        <h1 className="mt-2 text-center text-xl font-semibold text-slate-900">
          Start your TRA account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Multi-tenant SaaS access for design partners. Public sample demo stays free without an
          account.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase is not configured on this environment yet. Add{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, run the SQL migration, and
            set API <code className="text-xs">DATABASE_URL</code> +{" "}
            <code className="text-xs">SUPABASE_JWT_SECRET</code>. See{" "}
            <code className="text-xs">docs/SAAS-ROADMAP.md</code>.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Work email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            {info && (
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{info}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-800 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
