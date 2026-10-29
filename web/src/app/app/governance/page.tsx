"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ModuleShell";
import { getAccessToken, saasApi, type GovernanceCard, type GovernanceLibrary } from "@/lib/saas-api";

function sizeLabel(employees: number | null): string {
  if (!employees || employees <= 1) return "Any size";
  return `${employees} or more`;
}

function RuleList({ cards }: { cards: GovernanceCard[] }) {
  if (!cards.length) {
    return <p className="text-sm text-slate-500">None.</p>;
  }
  return (
    <ul className="space-y-3">
      {cards.map((card) => (
        <li key={card.id}>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{card.place}</p>
              {card.chip ? (
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
                  Chip
                </span>
              ) : null}
              <span className="text-xs uppercase tracking-wide text-slate-400">{card.instrument}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{card.summary}</p>
            <p className="mt-2 text-xs text-slate-500">
              {card.citation}
              {" · "}
              {sizeLabel(card.employees)}
              {" · "}
              effective {card.effective_on}
            </p>
            {card.source_url ? (
              <a
                href={card.source_url}
                className="mt-2 inline-block text-xs text-teal-800 underline"
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}

export default function GovernancePage() {
  const [asOf, setAsOf] = useState("");
  const [data, setData] = useState<GovernanceLibrary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const result = await saasApi.governance(token, asOf || undefined);
        if (cancelled) return;
        setData(result);
        setError(null);
        if (!asOf) setAsOf(result.as_of);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load rules");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asOf]);

  const empty =
    data?.empty_reason === "no_file"
      ? "No file yet. Clean a file that has a state or location column."
      : data?.empty_reason === "no_places"
        ? "This file has no state or location. The national pack stays off this workspace."
        : null;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Workspace · not a module
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Governance</h1>
        <p className="mt-2 text-slate-600">
          Rules for the places on the latest file. Federal cards ride along once any place is present.
          A card chips inside the time window. This is not a module. {data?.disclaimer || "Not legal advice."}
        </p>
      </div>

      <label className="block max-w-xs text-sm text-slate-700">
        Cycle or offer date
        <input
          type="date"
          value={asOf}
          onChange={(event) => setAsOf(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {data?.dataset_name ? (
        <p className="text-sm text-slate-500">
          File: {data.dataset_name}
          {data.places.length
            ? ` · ${data.places.map((place) => place.name).join(", ")}`
            : ""}
          {data.includes_federal ? " · federal included" : ""}
        </p>
      ) : null}
      {empty ? <p className="max-w-xl text-sm text-slate-700">{empty}</p> : null}

      {data && !empty ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              In force on this date
            </h2>
            <RuleList cards={data.current} />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Later
            </h2>
            <RuleList cards={data.future} />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ended before this date
            </h2>
            <RuleList cards={data.past} />
          </section>
        </div>
      ) : null}
    </div>
  );
}
