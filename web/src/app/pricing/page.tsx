import Link from "next/link";
import { SEAT_PATHS } from "@/lib/paths";

/** Fixed commercial prices — match Stripe test/live Price objects */
const saasModules = [
  {
    name: "Cleaner",
    price: "$129",
    unit: "/ month",
    blurb: "HRIS import, column mapping, quality score, Placement Engine on cleaned rows.",
  },
  {
    name: "Equity + Merit",
    price: "$249",
    unit: "/ month",
    blurb:
      "Dual-lens equity, flight risk, merit pool remediation, and Cycle Lock. Not a separate charge.",
  },
  {
    name: "Candidate Tracker",
    price: "$129",
    unit: "/ month",
    blurb: "Pipeline stages, offer packages, notes — handoff into Closer.",
  },
  {
    name: "Closer",
    price: "$199",
    unit: "/ month",
    blurb: "Four-year total wealth, a one-page offer PDF, and resume tally. Tally is not a separate charge.",
  },
];

const oneTime = [
  { name: "Cleaner", price: "$1,290", note: "Annual prepaid (~10× monthly)" },
  {
    name: "Equity + Merit",
    price: "$2,490",
    note: "Annual prepaid (~10× monthly). Includes Cycle Lock.",
  },
  { name: "Candidate Tracker", price: "$1,290", note: "Annual prepaid (~10× monthly)" },
  { name: "Closer", price: "$1,990", note: "Annual prepaid (~10× monthly)" },
  {
    name: "Full suite",
    price: "$4,990",
    note: "Annual prepaid (~10× monthly). Includes Cycle Lock.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Modules you can buy separately — or as a suite
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-600">
          First 30 days free. Card required. You won’t be charged until day 31. Cancel anytime from Billing.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Fixed monthly subscription pricing. Start with Cleaner, add Equity + Merit when you need
          defendable remediation and Cycle Lock, or close offers with Tracker + Closer.
          Design-partner pilots are still available via SOW. Cycle Lock is included with Equity + Merit
          and the full suite. It is not a fifth invoice.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Start free trial
          </Link>
          <Link
            href="/app/billing"
            className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-medium text-teal-900 hover:bg-teal-100"
          >
            Choose a plan
          </Link>
          <Link
            href="/cleaner"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Try public demo
          </Link>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">SaaS subscription</h2>
            <p className="mt-3 text-lg text-slate-600">Monthly per module. Hosted access. USD.</p>
          </div>
          <div className="rounded-3xl border border-teal-700/30 bg-white px-6 py-5">
            <div className="text-lg font-medium text-slate-900">Full suite</div>
            <div className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
              $499<span className="ml-2 text-lg font-normal text-slate-600">/ month</span>
            </div>
            <p className="mt-3 text-base text-slate-600">All four modules, including Cycle Lock. First 30 days free.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {saasModules.map((m) => (
            <div
              key={m.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-xl font-medium tracking-tight text-slate-900">{m.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
                  {m.price}
                </span>
                <span className="text-base text-slate-600">{m.unit}</span>
              </div>
              <p className="mt-4 flex-1 text-base leading-relaxed text-slate-600">{m.blurb}</p>
              <p className="mt-4 text-base text-teal-800">30 days free, then billed monthly</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14" id="seats">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Seats on top of the plan</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              The invoice unlocks modules for the workspace. The seat decides which of those a
              person opens. A talent workspace can hold Tracker and Closer together. That is
              those two prices, not a new product.
            </p>
          </div>
          <Link href="/paths" className="text-sm font-medium text-teal-800 hover:underline">
            See the paths
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SEAT_PATHS.map((path) => (
            <Link
              key={path.id}
              href={`/paths#${path.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
            >
              <h3 className="text-2xl font-medium tracking-tight text-slate-900">{path.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{path.line}</p>
              <p className="mt-3 text-base text-slate-500">{path.who}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-base leading-relaxed text-slate-600">
          A paid workspace holds 25,000 rows. The public demo holds 10. Owner holds billing and the team. Admin holds the team. A member does the rewards work.
          A viewer reads the plan and cannot upload or confirm. An executive reads offers, the
          cycle, philosophy, and the rules in force.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">One-time / annual licensing</h2>
        <p className="mt-4 text-lg text-slate-600">
          Prepaid annual licenses for design partners and internal deployments (terms via SOW).
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-base text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Module</th>
                <th className="px-6 py-4 font-medium">Annual license</th>
                <th className="px-6 py-4 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {oneTime.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="px-6 py-4 text-lg font-medium text-slate-900">{row.name}</td>
                  <td className="px-6 py-4 text-lg tabular-nums text-slate-800">{row.price}</td>
                  <td className="px-6 py-4 text-base text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">What you get</h3>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-slate-600">
            <li>· Shared Placement Engine (YOE + education)</li>
            <li>· Dual-lens equity + merit remediation</li>
            <li>· Cycle Lock on Equity + Merit and the suite</li>
            <li>· Four-year total wealth closeouts and resume tally</li>
            <li>· Datasets and Rules for the places on the file</li>
            <li>· A seat path for Rewards, Talent, HRBP, and Executive</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
          <h3 className="font-semibold">Design partner pilot</h3>
          <p className="mt-3 text-base leading-relaxed text-slate-300">
            Prefer a fixed-scope pilot with advisory sessions? Ask for a pilot SOW — or start a
            workspace and we can grant pilot access from the platform admin console.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/cleaner"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Try the demo
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Create workspace
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-12 text-base leading-relaxed text-slate-600">
        Prices in USD. Subscriptions billed monthly via Stripe. Public demo is sample data only.
        Taxes may apply.
      </p>
    </div>
  );
}
