"use client";

import { useMemo, useState } from "react";
import type { CycleLockPerson, CycleLockResult } from "@/lib/api";
import { money, ratio } from "@/lib/format";
import { Card, Stat } from "@/components/ModuleShell";

function bandLabel(band: string) {
  if (band === "under_range") return "Under range";
  if (band === "to_mid") return "To midpoint";
  if (band === "above_mid") return "Above mid";
  return band;
}

function bandClass(band: string) {
  if (band === "under_range") return "bg-rose-50 text-rose-700";
  if (band === "to_mid") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

export function CycleLockBoard({
  data,
  onConfirm,
  confirming,
}: {
  data: CycleLockResult;
  onConfirm: (id: string, confirmed: boolean) => void;
  confirming?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(data.people[0]?.id ?? null);
  const selected: CycleLockPerson | undefined = useMemo(
    () => data.people.find((p) => p.id === openId) || data.people[0],
    [data.people, openId]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Envelope" value={money(data.summary.envelope)} />
        <Stat label="Remaining" value={money(data.summary.remaining)} />
        <Stat label="Under-range repaired" value={money(data.summary.under_range_repaired)} />
        <Stat label="Above-mid merit" value={money(data.summary.above_midpoint_merit)} />
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          {data.team.name}
        </p>
        <p className="mt-1 text-sm text-slate-600">{data.philosophy.rule}</p>
        <p className="mt-2 text-xs text-slate-500">
          A 0.5% rating notch on this team's average pay is about {money(data.summary.paycheck_half_point)} per paycheck.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-3">Person</th>
                <th className="pb-2 pr-3">Pay / range</th>
                <th className="pb-2 pr-3">Pen</th>
                <th className="pb-2 pr-3">Proposed cash</th>
                <th className="pb-2">Chip</th>
              </tr>
            </thead>
            <tbody>
              {data.people.map((p) => {
                const chip = data.chips.find((c) => c.id === p.id);
                const active = selected?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer border-t border-slate-100 ${active ? "bg-slate-50" : ""}`}
                    onClick={() => setOpenId(p.id)}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.title}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-700">
                      {money(p.base)}
                      <div className="text-xs text-slate-500">
                        {money(p.range_min)}–{money(p.range_max)}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${bandClass(p.band)}`}>
                        {ratio(p.penetration)} · {bandLabel(p.band)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      {money(p.proposed_cash)}
                      <div className="text-xs font-normal text-slate-500">{p.proposed_pct.toFixed(1)}%</div>
                    </td>
                    <td className="py-2.5">
                      {chip ? (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                          {chip.applied ? "Confirmed" : "Pending"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Quiet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {data.chips.map((chip) => (
        <Card key={chip.id} className="border-teal-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Confirm-chip</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {chip.name} · {money(chip.amount)}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{chip.reason}</p>
            </div>
            <button
              type="button"
              disabled={confirming}
              onClick={() => onConfirm(chip.id, !chip.confirmed)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {chip.applied ? "Revoke confirm" : "Confirm exception"}
            </button>
          </div>
        </Card>
      ))}

      {selected && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">4-year wealth strip</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{selected.name}</h3>
          <p className="text-sm text-slate-600">
            New base {money(selected.new_base)} · year-1 cash {money(selected.wealth.year_1_cash)} ·
            4-yr {money(selected.wealth.four_year_total)}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            {selected.wealth.years.map((y) => (
              <div key={y.year} className="rounded-xl bg-slate-50 px-2 py-3">
                <div className="text-slate-500">Y{y.year}</div>
                <div className="mt-1 font-semibold text-slate-900">{money(y.year_total)}</div>
                <div className="text-slate-400">cum {money(y.cumulative)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
