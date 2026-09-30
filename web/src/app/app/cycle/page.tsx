"use client";

import { useEffect, useState } from "react";
import { api, type CycleLockResult } from "@/lib/api";
import { CycleLockBoard } from "@/components/CycleLockBoard";
import { ModuleGate } from "@/components/ModuleGate";
import { useWorkspace } from "@/lib/workspace-context";

export default function AppCyclePage() {
  const { permissions } = useWorkspace();
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
    <ModuleGate module="equity" permissions={permissions}>
      <div className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Workspace · Cycle Lock
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Range-first merit lock
          </h1>
          <p className="mt-2 text-slate-600">
            Formula proposes. Confirm-chip only on material exceptions. This board is the teardown
            you can show without a ratings matrix.
          </p>
        </div>
        {error && <p className="text-sm text-rose-700">{error}</p>}
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
      </div>
    </ModuleGate>
  );
}
