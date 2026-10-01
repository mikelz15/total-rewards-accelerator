"use client";

import { useEffect, useState } from "react";
import { api, type CycleLockResult } from "@/lib/api";
import { CycleLockBoard } from "@/components/CycleLockBoard";
import { ModuleShell } from "@/components/ModuleShell";

export default function CycleLockDemoPage() {
  const [data, setData] = useState<CycleLockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirms, setConfirms] = useState<Record<string, boolean>>({});

  async function load(next: Record<string, boolean>) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.cycleLockRun({ envelope_pct: 0.032, confirm_exceptions: next });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cycle lock failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load({});
  }, []);

  return (
    <ModuleShell
      eyebrow="Module 03 · Cycle Lock"
      title="Monday 8:00 — range spends the pool"
      description="Same 3.2% envelope. Ratings do not allocate it. Under-range repair first, deceleration to midpoint, $0 above mid, one exception on a confirm-chip."
    >
      {error && <p className="mb-4 text-sm text-rose-700">{error}</p>}
      {data ? (
        <CycleLockBoard
          data={data}
          confirming={busy}
          onConfirm={(id, confirmed) => {
            const next = { ...confirms, [id]: confirmed };
            setConfirms(next);
            load(next);
          }}
        />
      ) : (
        <p className="text-sm text-slate-500">Loading cycle lock…</p>
      )}
    </ModuleShell>
  );
}
