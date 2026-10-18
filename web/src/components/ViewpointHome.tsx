"use client";

import Link from "next/link";
import { Card } from "@/components/ModuleShell";
import type { DatasetSummary, GovernanceLibrary } from "@/lib/saas-api";

type Placement = {
  with_expected?: number;
  below_expected?: number;
  total_placement_gap?: number;
};

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function placementOf(dataset: DatasetSummary | undefined): Placement | null {
  const stats = dataset?.stats as { placement?: Placement } | undefined;
  const placement = stats?.placement;
  if (!placement || typeof placement !== "object") return null;
  return placement;
}

export function groupLine(datasets: DatasetSummary[]): string {
  const file = datasets[0];
  const placement = placementOf(file);
  if (!file || !placement || !placement.with_expected) {
    return "No pay file with placement yet. The group line shows up when a file is saved.";
  }
  const below = placement.below_expected ?? 0;
  const gap = placement.total_placement_gap ?? 0;
  if (below > 0) {
    return `${file.name}: ${below} of ${placement.with_expected} sit under expected placement, ${dollars(gap)} below. The offer's own gap is on the four-year page.`;
  }
  return `${file.name}: no one on that file sits under expected placement. The offer's own gap is on the four-year page.`;
}

export function HrbpHome({ datasets }: { datasets: DatasetSummary[] }) {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">HRBP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Place this person</h1>
        <p className="mt-2 text-slate-600">
          One offer. The manager gets the four-year page. The group is one line.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/app/closer"
          className="rounded-2xl border border-slate-200 border-t-4 border-t-teal-700 bg-white p-5 shadow-sm"
        >
          <p className="text-[10px] font-semibold tracking-widest text-teal-700">This person</p>
          <h3 className="mt-1 font-semibold text-slate-900">Place them</h3>
          <p className="mt-2 text-sm text-slate-600">
            Years and education, or a resume tally. Confirm fills Years of experience.
          </p>
        </Link>
        <Link
          href="/app/closer"
          className="rounded-2xl border border-slate-200 border-t-4 border-t-rose-500 bg-white p-5 shadow-sm"
        >
          <p className="text-[10px] font-semibold tracking-widest text-teal-700">For the manager</p>
          <h3 className="mt-1 font-semibold text-slate-900">Four-year page</h3>
          <p className="mt-2 text-sm text-slate-600">
            Base, bonus, and LTI as one total. Download the one-page PDF from that screen.
          </p>
        </Link>
      </div>
      <Card>
        <h2 className="text-sm font-semibold text-slate-900">The group</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{groupLine(datasets)}</p>
        <Link href="/app/equity" className="mt-4 inline-block text-sm font-medium text-teal-800">
          Open the group file
        </Link>
      </Card>
    </div>
  );
}

export function ExecutiveHome({
  datasets,
  offerCount,
  governance,
}: {
  datasets: DatasetSummary[];
  offerCount: number | null;
  governance: GovernanceLibrary | null;
}) {
  const chips = (governance?.current || []).filter((card) => card.chip);
  const rules =
    governance?.empty_reason === "no_file"
      ? "No pay file is saved, so no rule is in force for this workspace."
      : governance?.empty_reason === "no_places"
        ? "The latest file has no place, so the national pack stays off."
        : chips.length
          ? chips.map((card) => `${card.place} · ${card.citation || card.summary || "in force"}`).join(" · ")
          : "Nothing in force chips on the latest file.";

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Executive</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">The read</h1>
        <p className="mt-2 text-slate-600">
          Offers, the cycle, the philosophy, and the rules in force. This seat does not edit.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/app/closer" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold tracking-widest text-teal-700">Offers</p>
          <h3 className="mt-1 font-semibold text-slate-900">Against expected placement</h3>
          <p className="mt-2 text-sm text-slate-600">
            {offerCount === null
              ? "Opening the pipeline…"
              : `${offerCount} offer${offerCount === 1 ? "" : "s"} in the pipeline.`}{" "}
            {groupLine(datasets)}
          </p>
        </Link>
        <Link href="/app/cycle" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold tracking-widest text-teal-700">Cycle</p>
          <h3 className="mt-1 font-semibold text-slate-900">Range-first envelope</h3>
          <p className="mt-2 text-sm text-slate-600">
            3.2% of the file. Nothing above midpoint without a confirm. Open the cycle to see it
            on the sample.
          </p>
        </Link>
        <Link href="/app/philosophy" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold tracking-widest text-teal-700">Philosophy</p>
          <h3 className="mt-1 font-semibold text-slate-900">Does the file match the claim</h3>
          <p className="mt-2 text-sm text-slate-600">
            Midpoint, performance, and what is left in the department. The score is on that screen.
          </p>
        </Link>
        <Link href="/app/governance" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold tracking-widest text-teal-700">Rules in force</p>
          <h3 className="mt-1 font-semibold text-slate-900">
            {governance?.dataset_name || "Latest file"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{rules}</p>
        </Link>
      </div>
    </div>
  );
}
