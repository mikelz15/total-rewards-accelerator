import Link from "next/link";
import { Fold } from "@/components/Fold";
import { HeroFilm } from "@/components/HeroFilm";
import { SEAT_PATHS } from "@/lib/paths";

const modules = [
  {
    href: "/cleaner",
    step: "01",
    title: "Market Data Cleaner",
    blurb:
      "Messy HRIS → analysis-ready records. Maps columns, money, dates — then runs the shared Placement Engine.",
  },
  {
    href: "/auditor",
    step: "02",
    title: "Equity + Merit",
    blurb:
      "Market mid and expected placement. Flight risk scores under-market pay, a strong performer under the range, and tenure. The pool funds to mid, expected, or the max of both.",
  },
  {
    href: "/cycle",
    step: "03",
    title: "Cycle Lock",
    blurb:
      "Included with Equity + Merit. Range-first merit: 3.2% envelope, $0 above midpoint, confirm-chip for scarce exceptions.",
  },
  {
    href: "/philosophy",
    step: "—",
    title: "Philosophy Check",
    blurb:
      "Included with Equity. Does the pay file match the stated philosophy? Midpoint, performance, and leftover department effects.",
  },
  {
    href: "/candidates",
    step: "04",
    title: "Candidate Tracker",
    blurb:
      "Recruiting pipeline: stages, offer packages, notes — hand off to Closer for total-wealth statements.",
  },
  {
    href: "/closer",
    step: "05",
    title: "Candidate Closer",
    blurb:
      "Base / bonus / LTI → four-year total wealth and a one-page PDF. Resume tally on this page credits the resume, then confirm fills Years of experience.",
  },
];

const included = [
  {
    href: "/closer",
    title: "Resume tally",
    blurb:
      "On Closer, not its own invoice. Same benchmark is full credit, a near match is half, a different function is none.",
  },
  {
    href: "/paths#datasets",
    title: "Datasets",
    blurb: "Signed in, the cleaned file stays for Equity, Cycle, and Philosophy. The public demo does not keep it.",
  },
  {
    href: "/paths#rules",
    title: "Rules",
    blurb: "Signed in, for the places on that file. Not a module. A card chips when it is in the time window.",
  },
  {
    href: "/paths#rewards",
    title: "Job Match",
    blurb:
      "Included with Cleaner or Equity. One internal job to three external matches. Not an invoice.",
  },
];

const workflow = [
  { n: "01", label: "Clean", detail: "HRIS in" },
  { n: "02", label: "Place", detail: "YOE + edu" },
  { n: "03", label: "Audit", detail: "Equity risk" },
  { n: "04", label: "Lock", detail: "Range-first pool" },
  { n: "05", label: "Close", detail: "4-yr wealth" },
];

const edges = [
  {
    title: "Three-click speed",
    body: "No action, analysis, or remediation should take more than three clicks. Built for cycle time, not another dashboard graveyard.",
  },
  {
    title: "Defensible under EPA",
    body: "Shared Placement Engine (years of experience + education) produces personalized targets you can explain — not a black-box pay score.",
  },
  {
    title: "Four-year total wealth",
    body: "Closer turns base, bonus, and LTI into a multi-year trajectory and PDF. Most market tools stop at year-one cash.",
  },
];

const before = [
  ["Worker ID", "W-1001", "W-1002"],
  ["Legal Name", "Jane Doe", "Marcus Chen"],
  ["Total Base Pay Annualized", "$92,000", "88,500"],
  ["Pay Range Midpoint", "$110,000", "110000"],
];

const after = [
  ["name", "Jane Doe", "Marcus Chen"],
  ["base salary", "$92,000", "$88,500"],
  ["range midpoint", "$110,000", "$110,000"],
  ["years", "6", "4"],
  ["education", "Bachelors", "Bachelors"],
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl overflow-x-hidden px-4 py-14 sm:py-16">
      <section className="text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Stop crunching rows.
          <span className="mt-1 block text-ember">Start designing strategy.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          The sample file, from a messy extract to a cycle, an offer, and a credited resume.
        </p>
        <HeroFilm />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-medium text-white hover:bg-ember-deep"
          >
            Start free trial
          </Link>
          <Link
            href="/cleaner"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Try the demo
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          First 30 days free. Card required. Cancel anytime. The films use the sample file.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-sm font-medium text-slate-900">The same two people</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          The extract on the left is the sample. The columns on the right are what Cleaner keeps.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Extract
            </p>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="px-4 py-2 font-medium">Column</th>
                  <th className="px-4 py-2 font-medium">Jane Doe</th>
                  <th className="px-4 py-2 font-medium">Marcus Chen</th>
                </tr>
              </thead>
              <tbody>
                {before.map((row) => (
                  <tr key={row[0]} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{row[0]}</td>
                    <td className="px-4 py-2 text-slate-800">{row[1]}</td>
                    <td className="px-4 py-2 text-slate-800">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="min-w-0 overflow-x-auto rounded-2xl border border-teal-200 bg-white">
            <p className="border-b border-teal-100 bg-teal-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-teal-800">
              Cleaned
            </p>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-teal-700/70">
                  <th className="px-4 py-2 font-medium">Column</th>
                  <th className="px-4 py-2 font-medium">Jane Doe</th>
                  <th className="px-4 py-2 font-medium">Marcus Chen</th>
                </tr>
              </thead>
              <tbody>
                {after.map((row) => (
                  <tr key={row[0]} className="border-t border-teal-50">
                    <td className="px-4 py-2 font-mono text-xs text-teal-800">{row[0]}</td>
                    <td className="px-4 py-2 text-slate-900">{row[1]}</td>
                    <td className="px-4 py-2 text-slate-900">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ol className="mx-auto mt-14 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2">
        {workflow.map((step) => (
          <li key={step.n} className="flex items-baseline gap-2 text-sm">
            <span className="tabular-nums text-slate-400">{step.n}</span>
            <span className="font-medium text-slate-900">{step.label}</span>
            <span className="text-slate-500">{step.detail}</span>
          </li>
        ))}
      </ol>

      <section className="mt-20 grid gap-8 sm:grid-cols-3">
        {edges.map((edge) => (
          <div key={edge.title}>
            <h2 className="text-sm font-medium text-slate-900">{edge.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{edge.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-slate-900">Four ways in</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              The modules stay the same. The seat decides the door.
            </p>
          </div>
          <Link href="/paths" className="text-sm font-medium text-slate-900 hover:underline">
            See the paths
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SEAT_PATHS.map((path) => (
            <Link
              key={path.id}
              href={`/paths#${path.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{path.who}</p>
              <h3 className="mt-1 text-base font-medium text-slate-900">{path.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{path.line}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-sm font-medium text-slate-900">Tools</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Cycle Lock and Philosophy Check ship with Equity. Four invoices.
        </p>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {modules.map((module) => (
            <Fold key={module.href} kicker={module.step} title={module.title} href={module.href}>
              {module.blurb}
            </Fold>
          ))}
        </div>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {included.map((item) => (
            <Fold key={item.title} kicker="With" title={item.title} href={item.href}>
              {item.blurb}
            </Fold>
          ))}
        </div>
      </section>

      <p className="mt-12 max-w-2xl text-sm leading-relaxed text-slate-500">
        The public demo prefers the sample file. A custom upload is capped at 10 rows, scanned for
        sensitive headers, and limited to five a week from one address. Tracker and Closer stay on
        synthetic data. Do not upload a real employee or candidate file.
      </p>
    </div>
  );
}
