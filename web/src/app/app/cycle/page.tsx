"use client";

import { useEffect, useRef, useState } from "react";
import { api, type CycleLockResult } from "@/lib/api";
import { CycleLockBoard } from "@/components/CycleLockBoard";
import { ModuleGate } from "@/components/ModuleGate";
import { getAccessToken, saasApi } from "@/lib/saas-api";
import { useWorkspace } from "@/lib/workspace-context";

const SAMPLE_NAME = "Monday 8:00 cycle lock — Plant + Eng sample";

export default function AppCyclePage() {
  const { permissions } = useWorkspace();
  const [data, setData] = useState<CycleLockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirms, setConfirms] = useState<Record<string, boolean>>({});
  const datasetId = useRef("");

  async function load(next: Record<string, boolean>) {
    setBusy(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!datasetId.current) {
        const list = await saasApi.listDatasets(token);
        const file = list.datasets[0];
        if (!file) {
          setError("Save a staff file from Cleaner first.");
          return;
        }
        datasetId.current = file.id;
      }
      let res: CycleLockResult;
      try {
        res = await saasApi.cycleRun(token, {
          dataset_id: datasetId.current,
          envelope_pct: 0.032,
          confirm_exceptions: next,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (!/not found/i.test(message) || /dataset/i.test(message)) throw err;
        const full = await saasApi.getDataset(token, datasetId.current);
        res = await api.cycleLockRun({
          records: full.records,
          envelope_pct: 0.032,
          confirm_exceptions: next,
          team_name: full.name,
        });
        if (res.team.name === SAMPLE_NAME) {
          res = { ...res, team: { ...res.team, name: full.name } };
        }
      }
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cycle lock failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load({});
    // The file is chosen once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModuleGate module="equity" permissions={permissions}>
      <div className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Module 03 · Cycle Lock
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Range-first merit lock
          </h1>
          <p className="mt-2 text-slate-600">
            The envelope is the saved staff file. Cash stops at midpoint unless a confirm-chip is on.
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
          <p className="text-sm text-slate-500">{busy ? "Loading cycle lock…" : "No cycle yet."}</p>
        )}
      </div>
    </ModuleGate>
  );
}
