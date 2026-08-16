import Link from "next/link";

const saasModules = [
  {
    name: "Cleaner",
    price: "$99–$149",
    unit: "/ month",
    blurb: "HRIS import, column mapping, quality score, Placement Engine on cleaned rows.",
  },
  {
    name: "Equity + Merit",
    price: "$199–$299",
    unit: "/ month",
    blurb: "Dual-lens equity, flight risk, merit pool remediation toward mid or expected placement.",
  },
  {
    name: "Candidate Tracker",
    price: "$99–$149",
    unit: "/ month",
    blurb: "Pipeline stages, offer packages, notes — handoff into Closer.",
  },
  {
    name: "Closer",
    price: "$149–$249",
    unit: "/ month",
    blurb: "Four-year total wealth projection and one-page offer PDF.",
  },
];

const oneTime = [
  { name: "Cleaner", price: "$129–$179" },
  { name: "Equity + Merit", price: "$299–$399" },
  { name: "Candidate Tracker", price: "$129–$179" },
  { name: "Closer", price: "$199–$299" },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          Modules you can buy separately — or as a suite
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Total Rewards Accelerator is modular by design. Start with Cleaner, add Equity + Merit when
          you need defendable remediation, or close offers with Tracker + Closer. Design-partner
          pilots available — ranges below are indicative SaaS and one-time licensing bands.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create workspace
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in to app
          </Link>
          <a
            href="https://totalrewardsaccelerator.com"
            className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-medium text-teal-900 hover:bg-teal-100"
          >
            Try public demo
          </a>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">SaaS subscription</h2>
            <p className="mt-1 text-sm text-slate-500">Monthly per module · hosted access</p>
          </div>
          <div className="rounded-2xl border-2 border-teal-600 bg-teal-50 px-5 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              Full suite bundle
            </div>
            <div className="text-2xl font-semibold tabular-nums text-slate-900">$399–$599</div>
            <div className="text-xs text-slate-600">/ month · all four modules</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {saasModules.map((m) => (
            <div
              key={m.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{m.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums text-slate-900">
                  {m.price}
                </span>
                <span className="text-sm text-slate-500">{m.unit}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{m.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-slate-900">One-time licensing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Per-module license bands for design partners and internal deployments (terms via SOW).
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Module</th>
                <th className="px-5 py-3 font-medium">One-time license</th>
              </tr>
            </thead>
            <tbody>
              {oneTime.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-700">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">What you get</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>· Shared Placement Engine (YOE + education)</li>
            <li>· Dual-lens equity + merit remediation</li>
            <li>· Four-year total wealth closeouts</li>
            <li>· Three-click Comp Engineering workflow</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
          <h3 className="font-semibold">Design partner pilot</h3>
          <p className="mt-2 text-sm text-slate-300">
            Prefer a fixed-scope pilot with advisory sessions? Pilot pricing and SOW live in the
            go-to-market pack — or DM <strong className="text-teal-300">PILOT</strong> after you
            try the sample demo.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/cleaner"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Try the demo
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        Prices shown as ranges for planning; final commercial terms are set in a pilot SOW or
        subscription agreement. Public demo is sample data only.
      </p>
    </div>
  );
}
