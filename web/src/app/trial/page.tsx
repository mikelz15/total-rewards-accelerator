import Link from "next/link";

const included = [
  {
    name: "Cleaner",
    blurb: "HRIS import, column mapping, quality score — analysis-ready records in minutes.",
  },
  {
    name: "Equity + Merit",
    blurb: "Dual-lens equity, flight risk, merit pool remediation, and Cycle Lock.",
  },
  {
    name: "Candidate Tracker",
    blurb: "Pipeline stages, offer packages, notes — handoff into Closer.",
  },
  {
    name: "Closer",
    blurb: "Four-year total wealth, a one-page offer PDF, and resume tally.",
  },
];

export default function TrialPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Free trial
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Try the full suite free for 30 days
        </h1>
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-sm font-semibold text-teal-950">
            First 30 days free — every module included
          </p>
          <p className="mt-1 text-sm text-teal-900/80">
            Card required at checkout. You won&apos;t be charged until day 31. Cancel
            anytime from Billing.
          </p>
        </div>
        <p className="mt-4 text-lg text-slate-600">
          Run a real cycle on your own data: clean a file, place people, fund the
          merit pool, and close an offer. No demo call, no workbook — the sandbox
          is preloaded and ready.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            See pricing
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
        <h2 className="text-xl font-semibold text-slate-900">What&apos;s in the trial</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {included.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h3 className="font-semibold text-slate-900">{m.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{m.blurb}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Design-partner pilots are also available via SOW —{" "}
          <Link href="/pricing" className="font-medium text-teal-700 hover:underline">
            talk to us
          </Link>{" "}
          if you&apos;d rather start there.
        </p>
      </section>
    </div>
  );
}
