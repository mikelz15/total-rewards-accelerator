"use client";

import Link from "next/link";
import { Card, Stat } from "@/components/ModuleShell";
import { groupLine } from "@/components/ViewpointHome";
import type { DatasetSummary, GovernanceLibrary, MeResponse } from "@/lib/saas-api";
import { BOARD, boardOpens, pathForRole, showDatasets, workspaceHref } from "@/lib/paths";

const SEAT_LABEL: Record<string, string> = {
  owner: "Rewards · owner",
  admin: "Rewards · admin",
  member: "Rewards · member",
  viewer: "Viewer",
  ta: "Talent",
  hrbp: "HRBP",
  executive: "Executive",
};

export function SeatDashboard({
  me,
  loading,
  datasets,
  candidateCount,
  offerCount,
  governance,
}: {
  me: MeResponse | null;
  loading: boolean;
  datasets: DatasetSummary[];
  candidateCount: number;
  offerCount: number | null;
  governance: GovernanceLibrary | null;
}) {
  const role = me?.membership.role;
  const path = pathForRole(role);
  const access = me?.permissions?.module_access;
  const chips = (governance?.current || []).filter((card) => card.chip);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {me
            ? `Welcome back${me.user.email ? `, ${me.user.email.split("@")[0]}` : ""}`
            : "Your workspace"}
        </h1>
        <p className="mt-2 text-slate-600">
          Every seat sees this board. Your door is marked. The other modules stay visible so the
          map is the same for the whole workspace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Organization" value={loading ? "…" : me?.org.name || "—"} />
        <Stat
          label="Plan"
          value={loading ? "…" : me?.org.plan || "—"}
        />
        <Stat
          label="Seat"
          value={loading ? "…" : SEAT_LABEL[role || ""] || role || "—"}
        />
        <Stat
          label="Datasets · candidates"
          value={loading ? "…" : `${datasets.length} · ${candidateCount}`}
          tone="good"
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          All modules
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BOARD.map((card) => {
            const opens = boardOpens(role, card, access);
            return (
              <div
                key={card.href + card.title}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  opens ? "border-slate-200 border-t-4 border-t-teal-700" : "border-slate-200"
                }`}
              >
                <p className="text-[10px] font-semibold tracking-widest text-teal-700">{card.step}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{card.body}</p>
                <p className="mt-3 text-xs text-slate-500">{card.seats}</p>
                {opens ? (
                  <Link href={card.href} className="mt-3 text-sm font-medium text-teal-800">
                    Open
                  </Link>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">Visible on this board</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className={`grid gap-6 ${showDatasets(role) ? "lg:grid-cols-2" : ""}`}>
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">{path.title} path</h2>
          <p className="mt-2 text-sm text-slate-600">{path.line}</p>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            {path.steps.map((step, index) => (
              <li key={step.label} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>
                  <Link href={workspaceHref(step.href)} className="font-medium text-slate-900 hover:underline">
                    {step.label}
                  </Link>
                  <span className="mt-0.5 block">{step.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        {showDatasets(role) && (
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Recent datasets</h2>
              <Link href="/app/datasets" className="text-sm font-medium text-teal-800 hover:underline">
                View all
              </Link>
            </div>
            {datasets.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No datasets yet.{" "}
                <Link href="/app/cleaner" className="font-medium text-teal-800 hover:underline">
                  Clean and save one
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {datasets.slice(0, 5).map((dataset) => (
                  <li key={dataset.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{dataset.name}</p>
                      <p className="text-slate-500">
                        {dataset.row_count} rows
                        {dataset.source_filename ? ` · ${dataset.source_filename}` : ""}
                      </p>
                    </div>
                    <Link href="/app/equity" className="shrink-0 font-medium text-teal-800 hover:underline">
                      Equity
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {role === "hrbp" && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">The group</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{groupLine(datasets)}</p>
        </Card>
      )}

      {role === "executive" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Offers</h2>
            <p className="mt-3 text-sm text-slate-700">
              {offerCount === null
                ? "Opening the pipeline…"
                : `${offerCount} offer${offerCount === 1 ? "" : "s"} in the pipeline.`}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Rules in force</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {governance?.empty_reason === "no_file"
                ? "No pay file is saved, so no rule is in force for this workspace."
                : governance?.empty_reason === "no_places"
                  ? "The latest file has no place, so the national pack stays off."
                  : chips.length
                    ? chips.map((card) => `${card.place} · ${card.citation || card.summary || "in force"}`).join(" · ")
                    : "Nothing in force chips on the latest file."}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
