import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const modules = [
  {
    href: "/cleaner",
    step: "01",
    title: "Market Data Cleaner",
    blurb: "Real HRIS exports: Workday-style headers, money, text ratings, FTE %, inactive rows — analysis-ready in seconds.",
    accent: "border-t-blue-500",
  },
  {
    href: "/auditor",
    step: "02",
    title: "Equity + Merit Pool",
    blurb: "Compa heatmap, flight-risk scores, and remediation sandbox that allocates a merit pool to fix parity.",
    accent: "border-t-teal-600",
  },
  {
    href: "/candidates",
    step: "03",
    title: "Candidate Tracker",
    blurb: "Recruiting pipeline: stages, offer packages, notes — hand off to Closer for total-wealth PDFs.",
    accent: "border-t-violet-500",
  },
  {
    href: "/closer",
    step: "04",
    title: "Candidate Closer",
    blurb: "Base, bonus, and LTI → multi-year total wealth projection and one-page PDF statement.",
    accent: "border-t-rose-500",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Comp Engineering Toolkit · Mikéz
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl text-balance">
            The Total Rewards Accelerator
          </h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-teal-800">
            Making compensation easy
          </p>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Stop crunching rows. Start designing strategy. Cleaner → equity & flight risk → merit
            remediation → candidate pipeline → close with total wealth.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cleaner"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Start with Cleaner
            </Link>
            <Link
              href="/auditor"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Equity + Merit Pool
            </Link>
            <Link
              href="/closer"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Candidate Closer
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Demo tip: <strong>Reset demo</strong> in the nav reloads the messy HRIS sample. Export
            CSVs from Cleaner and Equity + Merit after each step.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-5 flex justify-center border-b border-slate-100 pb-5">
            <BrandLogo variant="hero" href={null} priority />
          </div>
          <p className="text-sm font-medium text-slate-900">Three-Click Philosophy</p>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                1
              </span>
              Import messy HRIS data
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                2
              </span>
              Audit equity + flight risk
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                3
              </span>
              Allocate merit pool / close offers
            </li>
          </ol>
          <p className="mt-6 text-xs text-slate-500">
            Built by Mikéz · Portfolio program from Total Rewards Accelerator
          </p>
        </div>
      </section>

      <section className="mt-14 grid gap-5 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`group rounded-2xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${m.accent}`}
          >
            <div className="text-xs font-semibold tracking-widest text-slate-400">{m.step}</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-teal-800">
              {m.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.blurb}</p>
            <span className="mt-4 inline-block text-sm font-medium text-teal-700">Open module →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
