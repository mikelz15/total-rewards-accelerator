import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const modules = [
  {
    href: "/cleaner",
    step: "01",
    title: "Market Data Cleaner",
    blurb:
      "Messy HRIS → analysis-ready records. Maps columns, money, dates — then runs the shared Placement Engine.",
    accent: "border-t-blue-500",
  },
  {
    href: "/auditor",
    step: "02",
    title: "Equity + Merit",
    blurb:
      "Dual-lens equity (market mid + expected placement), flight risk, and merit pool remediation you can defend.",
    accent: "border-t-teal-600",
  },
  {
    href: "/candidates",
    step: "03",
    title: "Candidate Tracker",
    blurb:
      "Recruiting pipeline: stages, offer packages, notes — hand off to Closer for total-wealth statements.",
    accent: "border-t-violet-500",
  },
  {
    href: "/closer",
    step: "04",
    title: "Candidate Closer",
    blurb:
      "Base / bonus / LTI → four-year total wealth projection and a one-page PDF most tools never produce.",
    accent: "border-t-rose-500",
  },
];

const workflow = [
  { n: "01", label: "Clean", detail: "HRIS in" },
  { n: "02", label: "Place", detail: "YOE + edu" },
  { n: "03", label: "Audit", detail: "Equity risk" },
  { n: "04", label: "Fund", detail: "Merit pool" },
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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Comp Engineering Toolkit · Mikéz
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl text-balance">
            Stop crunching rows. Start designing strategy.
          </h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-teal-800">
            Making compensation easy
          </p>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            A three-click modular system — Cleaner, Equity + Merit, Candidate Tracker, and Closer —
            powered by one shared Placement Engine that turns years of experience and education into
            personalized, defendable pay targets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cleaner"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try public demo
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-medium text-teal-900 hover:bg-teal-100"
            >
              Create workspace
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Demo tip: <strong>Reset demo</strong> in the nav reloads the messy HRIS sample. Prefer
            sample data — uploads are capped and scanned on the public demo.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="mb-5 flex justify-center border-b border-slate-100 pb-5">
            <BrandLogo variant="hero" href={null} priority />
          </div>
          <p className="text-sm font-medium text-slate-900">End-to-end workflow</p>
          <p className="mt-1 text-xs text-slate-500">
            One placement model. Four modules. Three clicks.
          </p>
          <div className="mt-5 flex flex-wrap items-stretch gap-2">
            {workflow.map((step, i) => (
              <div key={step.n} className="flex items-center gap-2">
                <div className="min-w-[4.5rem] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <div className="text-[10px] font-semibold tracking-widest text-teal-700">
                    {step.n}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{step.label}</div>
                  <div className="text-[11px] text-slate-500">{step.detail}</div>
                </div>
                {i < workflow.length - 1 && (
                  <span className="hidden text-slate-300 sm:inline" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-200">
            <span className="font-semibold text-teal-300">Placement Engine</span> sits under every
            module: expected position-in-range from YOE + education — market mid and experience lens
            side by side.
          </div>
          <p className="mt-4 text-xs text-slate-500">Built by Mikéz · Design-partner ready</p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          Why this is different
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {edges.map((e) => (
            <div
              key={e.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          Four modules
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
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
              <span className="mt-4 inline-block text-sm font-medium text-teal-700">
                Open module →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold">Public demo guardrails</p>
        <p className="mt-1 text-amber-900/90">
          Custom Cleaner uploads are capped at <strong>10 rows</strong>, scanned for sensitive
          headers (SSN, DOB, address, etc.), and rate-limited to{" "}
          <strong>5 uploads per IP per week</strong>. Candidate Tracker and Closer run on{" "}
          <strong>synthetic sample data only</strong>. Do not upload real employee or candidate
          files.
        </p>
      </section>
    </div>
  );
}
