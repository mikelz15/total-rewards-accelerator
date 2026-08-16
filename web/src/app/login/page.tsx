"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/app";
  const setup = search.get("setup") === "1";
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"account" | "demo" | "forgot">(
    configured ? "account" : "demo"
  );

  async function onAccountSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) throw signError;
      router.replace(next.startsWith("/") ? next : "/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/auth/reset-password`
          : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) throw resetError;
      setInfo(
        "If an account exists for that email, a reset link is on the way. Check your inbox (and spam). The link opens TRA so you can set a new password."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  async function onDemoSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/demo-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: demoPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Login failed");
      }
      router.replace(next === "/app" ? "/" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "forgot"
      ? "Reset password"
      : mode === "account"
        ? "Workspace login"
        : "Design partner demo";

  const subtitle =
    mode === "forgot"
      ? "We’ll email you a link to choose a new password for your workspace."
      : mode === "account"
        ? "Sign in to your organization workspace (saved datasets, candidates)."
        : "Enter the shared demo password if this environment is gated.";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <BrandLogo variant="login" href="/" priority />
        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          {title}
        </p>
        <p className="mt-2 text-center text-sm text-slate-600">{subtitle}</p>

        {search.get("error") === "confirm" && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Email confirmation did not complete
            {search.get("detail") ? `: ${search.get("detail")}` : "."} Try signing in
            below, or use Forgot password.
          </p>
        )}

        {setup && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            SaaS env vars are missing. Configure Supabase (see docs/SAAS-ROADMAP.md) or continue on
            the public demo.
          </p>
        )}

        {configured && mode !== "forgot" && (
          <div className="mt-5 flex rounded-full bg-slate-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("account");
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-full py-1.5 ${
                mode === "account" ? "bg-white font-medium shadow-sm" : "text-slate-600"
              }`}
            >
              Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("demo");
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-full py-1.5 ${
                mode === "demo" ? "bg-white font-medium shadow-sm" : "text-slate-600"
              }`}
            >
              Demo password
            </button>
          </div>
        )}

        {mode === "forgot" && configured ? (
          <form onSubmit={onForgotSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="you@company.com"
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
              disabled={loading || !email}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-sm text-slate-600">
              <button
                type="button"
                className="font-medium text-teal-800 hover:underline"
                onClick={() => {
                  setMode("account");
                  setError(null);
                  setInfo(null);
                }}
              >
                Back to sign in
              </button>
            </p>
          </form>
        ) : mode === "account" && configured ? (
          <form onSubmit={onAccountSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Password
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-teal-800 hover:underline"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setInfo(null);
                    setPassword("");
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm text-slate-600">
              No account?{" "}
              <Link href="/signup" className="font-medium text-teal-800 hover:underline">
                Create workspace
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={onDemoSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Password
              </span>
              <input
                type="password"
                autoFocus
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="Demo password"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !demoPassword}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Checking…" : "Enter demo"}
            </button>
            {configured && (
              <p className="text-center text-sm text-slate-600">
                Prefer a full account?{" "}
                <button
                  type="button"
                  className="font-medium text-teal-800 hover:underline"
                  onClick={() => setMode("account")}
                >
                  Account login
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
