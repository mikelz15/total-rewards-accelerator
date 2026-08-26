"use client";

import { useEffect, useState } from "react";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { Button, Card, Stat } from "@/components/ModuleShell";

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

  async function load() {
    const token = await getAccessToken();
    const [s, c] = await Promise.all([saasApi.billingStatus(token), saasApi.billingCatalog(token)]);
    setStatus(s);
    setCatalog(c);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
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

  const mods = status?.permissions?.modules || [];

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
          Org owners manage subscription licenses here. Module access is enforced for every seat
          based on plan + role.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {info && (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">{info}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Current plan" value={status?.plan || "—"} />
        <Stat
          label="Status"
          value={status?.suspended ? "Suspended" : "Active"}
          tone={status?.suspended ? "bad" : "good"}
        />
        <Stat label="Modules unlocked" value={String(mods.length)} tone="good" />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Your entitlements</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(status?.permissions?.module_access
            ? Object.entries(status.permissions.module_access)
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
          Role: <strong>{status?.permissions?.role}</strong> · Plan modules:{" "}
          {(status?.permissions?.plan_modules || []).join(", ") || "—"}
        </p>
      </Card>

      {catalog?.promo?.enabled ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          <p className="font-semibold">{catalog.promo.label}</p>
          <p className="mt-1 text-teal-900/80">{catalog.promo.detail}</p>
        </div>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Upgrade / subscribe</h2>
            <p className="mt-1 text-sm text-slate-500">
              {catalog?.stripe_enabled
                ? catalog?.promo?.enabled
                  ? "Start with a free trial — Stripe Checkout collects your card securely."
                  : "Checkout opens Stripe securely."
                : catalog?.note || "Stripe not configured — contact your platform admin for a pilot grant."}
            </p>
          </div>
          {status?.can_manage_billing && status.subscription?.stripe_customer_id ? (
            <Button variant="ghost" disabled={!!busy} onClick={openPortal}>
              Manage payment method
            </Button>
          ) : null}
        </div>
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
                  {status?.can_manage_billing ? (
                    <Button
                      disabled={!!busy || !p.checkout_ready}
                      onClick={() => startCheckout(p.id)}
                    >
                      {cta}
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-500">Only the org owner can checkout.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
