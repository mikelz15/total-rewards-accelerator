import Link from "next/link";

const products = [
  {
    name: "Pay-Equity Auditor Template",
    price: "$129",
    blurb: "Gap tables by family and level, LINEST regression on log salary, per-employee flags. Framed as a first-pass screening tool, not a legal audit.",
    gumroad: "https://mikezll.gumroad.com",
  },
  {
    name: "4-Year Total Wealth Projector",
    price: "$99",
    blurb: "One offer in, four-year trajectory and a one-page summary out. Does not test against internal equity or ranges.",
    gumroad: "https://mikezll.gumroad.com",
  },
  {
    name: "Merit and Bonus Workbook",
    price: "$99",
    blurb: "21-point checklist, editable 5x3 merit matrix, merit model with equity-risk flags, bonus model with proration.",
    gumroad: "https://mikezll.gumroad.com",
  },
  {
    name: "Market Data Cleaner Template",
    price: "$79",
    blurb: "Rules-and-formulas layer only (title/location maps, FX, aging, QC flags). Practitioner-run layer, not the TRA Cleaner engine.",
    gumroad: "https://mikezll.gumroad.com",
  },
  {
    name: "Clean Your HRIS Extract Before a Cycle",
    price: "$49",
    blurb: "5-page PDF guide plus a 2:54 narrated walkthrough film teaching the five cleaning passes.",
    gumroad: "https://mikezll.gumroad.com",
  },
];

export default function StorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Store
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          Standalone tools and templates
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Instant download. No subscription required. These are offline or lightweight versions of the modules. Full hosted access with saved datasets and multi-seat workspaces is on the Pricing page.
        </p>
      </div>

      <section className="mt-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{p.name}</h3>
              <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">
                {p.price}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{p.blurb}</p>
              <a
                href={p.gumroad}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800"
              >
                Buy on Gumroad
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Formula Evaluator — coming soon</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload a merit or bonus file and get ranked flags for data, logic, and equity issues. First-pass screening, not a legal determination. Hosted version of the same checks behind the Pay-Equity Auditor template.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Pricing and waitlist details will appear here once the MVP is live.
        </p>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        Prices are one-time. Files are delivered immediately via Gumroad. These tools are for review and planning. They are not legal or compliance determinations. Looking for hosted modules? See <Link href="/pricing" className="underline">Pricing</Link>.
      </p>
    </div>
  );
}
