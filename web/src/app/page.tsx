import Link from "next/link";

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
      "Dual-lens equity (market mid + expected placement), flight risk, and merit pool remediation you can defend.",
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
      "Base / bonus / LTI → four-year total wealth projection and a one-page PDF most tools never produce.",
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

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <section className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
        <div>
          <p className="text-sm text-slate-500">Comp engineering toolkit</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl text-balance">
            Stop crunching rows. Start designing strategy.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Clean a file, place people, fund a cycle, and close an offer. One placement model
            underneath, built to take three clicks.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Start free trial
            </Link>
            <Link
              href="/cleaner"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Try the demo
            </Link>
            <Link href="/pricing" className="px-2 text-sm text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            First 30 days free. Card required. Cancel anytime.
          </p>
        </div>

        <ol className="border-t border-slate-200 lg:border-l lg:border-t-0 lg:pl-8">
          {workflow.map((step) => (
            <li key={step.n} className="flex gap-4 border-b border-slate-200 py-3 last:border-b-0">
              <span className="w-6 text-sm tabular-nums text-slate-400">{step.n}</span>
              <span>
                <span className="block text-sm font-medium text-slate-900">{step.label}</span>
                <span className="text-sm text-slate-500">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 grid gap-8 sm:grid-cols-3">
        {edges.map((edge) => (
          <div key={edge.title}>
            <h2 className="text-sm font-medium text-slate-900">{edge.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{edge.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20">
        <h2 className="text-sm font-medium text-slate-900">Tools</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Cycle Lock and Philosophy Check ship with Equity. Four invoices.
        </p>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:items-baseline sm:gap-6"
            >
              <span className="text-sm tabular-nums text-slate-400">{module.step}</span>
              <span>
                <span className="text-base font-medium text-slate-900 group-hover:underline">
                  {module.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">{module.blurb}</span>
              </span>
            </Link>
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
