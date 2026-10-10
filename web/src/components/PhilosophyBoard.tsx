"use client";

import type { PhilosophyResult } from "@/lib/api";
import { Card, Stat } from "@/components/ModuleShell";

function statusLabel(status: string) {
  if (status === "aligned") return "Aligned";
  if (status === "not_aligned") return "Not aligned";
  return "Untested";
}

function statusClass(status: string) {
  if (status === "aligned") return "bg-teal-50 text-teal-800";
  if (status === "not_aligned") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function three(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}

export function PhilosophyBoard({ data }: { data: PhilosophyResult }) {
  const market = data.claims.find((c) => c.id === "market");
  const performance = data.claims.find((c) => c.id === "performance");
  const outsideTone = data.scores.outside_band_pct > 25 ? "bad" : "default";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Median ratio"
          value={three(data.scores.median_ratio)}
          tone={market?.status === "aligned" ? "good" : "bad"}
        />
        <Stat
          label="Rating, one point"
          value={
            data.scores.rating_pay_pct === null
              ? "—"
              : `${data.scores.rating_pay_pct > 0 ? "+" : ""}${data.scores.rating_pay_pct.toFixed(1)}%`
          }
          tone={performance?.status === "aligned" ? "good" : performance?.status === "not_aligned" ? "bad" : "default"}
        />
        <Stat
          label="Leftover variance"
          value={data.scores.residual_variance === null ? "—" : data.scores.residual_variance.toFixed(4)}
        />
        <Stat
          label="Outside 0.90–1.10"
          value={`${data.scores.outside_band} of ${data.usable}`}
          tone={outsideTone}
        />
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Stated philosophy
        </p>
        <p className="mt-1 text-sm text-slate-800">{data.philosophy.name}</p>
        <p className="mt-2 text-xs text-slate-500">
          Sample of {data.usable} people. As of {data.as_of}. {data.caveat}
        </p>
        <ul className="mt-4 space-y-3">
          {data.claims.map((claim) => (
            <li key={claim.id} className="rounded-xl border border-slate-100 px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(claim.status)}`}>
                  {statusLabel(claim.status)}
                </span>
                <span className="text-sm font-medium text-slate-900">{claim.statement}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{claim.test}</p>
              <p className="mt-1 text-sm text-slate-700">{claim.detail}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Drivers of log pay
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Department effects are versus {data.scores.reference_department || "the largest group"}.
          R² {data.scores.r_squared === null ? "—" : data.scores.r_squared.toFixed(3)}.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-3">Driver</th>
                <th className="pb-2 pr-3">Coefficient</th>
                <th className="pb-2">Std. error</th>
              </tr>
            </thead>
            <tbody>
              {data.drivers.filter((d) => d.name !== "Intercept").map((d) => (
                <tr key={d.name} className="border-t border-slate-100">
                  <td className="py-2 pr-3 text-slate-800">{d.name}</td>
                  <td className="py-2 pr-3 tabular-nums text-slate-700">{three(d.coef)}</td>
                  <td className="py-2 tabular-nums text-slate-500">{three(d.se)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Positioning
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-3">Person</th>
                <th className="pb-2 pr-3">Department</th>
                <th className="pb-2 pr-3">Ratio</th>
                <th className="pb-2 pr-3">Rating</th>
                <th className="pb-2">Band</th>
              </tr>
            </thead>
            <tbody>
              {data.people.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.title}</div>
                  </td>
                  <td className="py-2 pr-3 text-slate-700">{p.department}</td>
                  <td className="py-2 pr-3 tabular-nums text-slate-800">{three(p.ratio)}</td>
                  <td className="py-2 pr-3 tabular-nums text-slate-700">
                    {p.rating === null ? "—" : p.rating.toFixed(1)}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.outside ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-800"
                      }`}
                    >
                      {p.outside ? "Outside" : "Inside"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
