"use client";

import { useEffect, useState } from "react";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { Button, Card, Stat } from "@/components/ModuleShell";
import { roleLabel } from "@/lib/permissions";
import { useWorkspace } from "@/lib/workspace-context";

export default function BillingPage() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof saasApi.billingStatus>> | null>(
    null
  );
  const [catalog, setCatalog] = useState<
    Awaited<ReturnType<typeof saasApi.billingCatalog>> | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { me } = useWorkspace();

  async function load() {
    setLoadingStatus(true);
    setError(null);
    try {
      const token = await getAccessToken();
      // Status and catalog are independent. One failing must not blank the other
      // (Promise.all used to drop both and the page fell back to
      // "Stripe not configured / 0 modules unlocked").
      const [s, c] = await Promise.allSettled([
        saasApi.billingStatus(token),
        saasApi.billingCatalog(token),
      ]);
      if (s.status === "fulfilled") setStatus(s.value);
      if (c.status === "fulfilled") setCatalog(c.value);
      const failed = [s, c].find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (failed) {
        const reason = failed.reason instanceof Error ? failed.reason.message : "Load failed";
        setError(`Could not load billing details: ${reason}`);
      }
    } catch (e) {
      setError(`Could not load billing details: ${e instanceof Error ? e.message : "Load failed"}`);
    } finally {
      setLoadingStatus(false);
    }
  }

  // If the first load ran before the session was ready, try again once the
  // workspace profile arrives.
  useEffect(() => {
    if (me?.org.id && !status && !loadingStatus) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.org.id]);

  useEffect(() => {
    void load();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      if (q.get("checkout") === "success") {
        setInfo(
          "Checkout complete — your free trial is starting. If modules are not unlocked yet, wait a few seconds and refresh."
        );
      }
      if (q.get("checkout") === "cancel") {
        setInfo("Checkout canceled. No charge was made.");
      }
    }
  }, []);

  async function startCheckout(product: string) {
    setBusy(product);
    setError(null);
    try {
      const token = await getAccessToken();
      const { url } = await saasApi.checkout(token, product);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const token = await getAccessToken();
      const { url } = await saasApi.portal(token);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setBusy(null);
    }
  }

  // Fall back to the workspace profile's permissions if the status call failed.
  const perms = status?.permissions || me?.permissions || null;
  const canManageBilling = status?.can_manage_billing ?? perms?.can_manage_billing ?? false;
  const mods = perms?.modules || [];
  const pending = loadingStatus && !status;
  const plan = (status?.plan || me?.org.plan || "trial").trim().toLowerCase();
  const mayAddLicense = plan === "" || plan === "trial" || plan === "demo" || plan === "none";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Settings · Billing
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Plan &amp; licenses
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Owner manages the subscription here. Module access follows the plan and the seat.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-medium underline">
            Retry
          </button>
        </p>
      )}
      {info && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{info}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Current plan" value={pending ? "Loading…" : status?.plan || me?.org.plan || "—"} />
        <Stat
          label="Status"
          value={status?.suspended ? "Suspended" : "Active"}
          tone={status?.suspended ? "bad" : "good"}
        />
        <Stat
          label="Modules unlocked"
          value={pending ? "…" : perms ? String(mods.length) : "—"}
          tone="good"
        />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Your entitlements</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(perms?.module_access
            ? Object.entries(perms.module_access)
            : []
          ).map(([id, on]) => (
            <span
              key={id}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                on ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-500"
              }`}
            >
              {id}: {on ? "on" : "off"}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Role: <strong>{roleLabel(perms?.role)}</strong> · Plan modules:{" "}
          {(perms?.plan_modules || []).join(", ") || "—"}
        </p>
      </Card>

      {mayAddLicense && catalog?.promo?.enabled ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          <p className="font-semibold">{catalog.promo.label}</p>
          <p className="mt-1 text-teal-900/80">{catalog.promo.detail}</p>
        </div>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mayAddLicense ? "Upgrade / subscribe" : "Plan"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mayAddLicense
                ? !catalog
                  ? pending
                    ? "Loading plans…"
                    : "Plans could not be loaded. Use Retry above."
                  : catalog.stripe_enabled
                  ? catalog?.promo?.enabled
                    ? "Start with a free trial — Stripe Checkout collects your card securely."
                    : "Checkout opens Stripe securely."
                  : catalog?.note || "Stripe not configured — contact your platform admin for a pilot grant."
                : "This workspace already has a plan. Another license is not added from here."}
            </p>
          </div>
          {canManageBilling && status?.subscription?.stripe_customer_id ? (
            <Button variant="ghost" disabled={!!busy} onClick={openPortal}>
              Manage payment method
            </Button>
          ) : null}
        </div>
        {mayAddLicense ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(catalog?.products || []).map((p) => {
              const trialDays = p.trial_days ?? catalog?.trial_days ?? 0;
              const cta =
                busy === p.id
                  ? "Redirecting…"
                  : !p.checkout_ready
                    ? "Stripe not set"
                    : trialDays > 0
                      ? "Start free trial"
                      : "Subscribe";
              return (
                <div
                  key={p.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.price_label}</p>
                  {trialDays > 0 ? (
                    <p className="mt-1 text-xs font-medium text-teal-800">
                      {trialDays} days free, then {p.price_label}
                    </p>
                  ) : null}
                  {p.modules && (
                    <p className="mt-2 text-xs text-slate-500">{p.modules.join(" · ")}</p>
                  )}
                  <div className="mt-auto pt-4">
                    {canManageBilling ? (
                      <Button
                        disabled={!!busy || !p.checkout_ready}
                        onClick={() => startCheckout(p.id)}
                      >
                        {cta}
                      </Button>
                    ) : (
                      <p className="text-xs text-slate-500">Only the Owner can check out.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
