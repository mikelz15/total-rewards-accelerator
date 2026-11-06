import type { Metadata } from "next";
import Link from "next/link";
import { Fold } from "@/components/Fold";
import { CLIENT_DOORS, SEAT_PATHS } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Paths · Total Rewards Accelerator",
  description:
    "Four seats. Rewards, Talent, HRBP, and Executive each open a different set of the same modules.",
};

const invoices = [
  { name: "Cleaner", price: "$129", note: "The extract, mapped and saved." },
  { name: "Equity + Merit", price: "$249", note: "Audit, flight risk, the pool, Cycle Lock, and Philosophy Check." },
  { name: "Candidate Tracker", price: "$129", note: "The pipeline." },
  { name: "Closer", price: "$199", note: "Four-year wealth, the PDF, and resume tally." },
];

export default function PathsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Same modules. The seat chooses the door.
        </h1>
        <p className="mt-6 text-xl leading-relaxed text-slate-600">
          A plan decides what the workspace paid for. A seat decides which of those modules
          this person opens, and whether they can change anything.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        {SEAT_PATHS.map((path) => (
          <section key={path.id} id={path.id} className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{path.title}</h2>
              <p className="text-base text-slate-500">{path.who}</p>
            </div>
            <p className="mt-3 text-lg text-slate-600">{path.line}</p>
            <ol className="mt-6 list-none">
              {path.steps.map((step, index) => (
                <li key={`${path.id}-${step.label}`}>
                  <Fold
                    kicker={String(index + 1).padStart(2, "0")}
                    title={step.label}
                    href={step.href}
                  >
                    {step.note}
                  </Fold>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section id="seats" className="mt-16 scroll-mt-24">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Who holds the keys</h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Four doors. Rewards is one of them. Owner, Admin, and Member share that door.
          The keys are the only difference. A new seat is not added from the workspace.
          The platform issues a license first. The license has a start and an end.
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">Rewards</h3>
          <p className="mt-2 text-base text-slate-600">{CLIENT_DOORS[0].line}</p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-3">
            {CLIENT_DOORS[0].keys.map((key) => (
              <div key={key.role}>
                <dt className="font-medium text-slate-900">{key.name}</dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-600">{key.note}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {CLIENT_DOORS.slice(1).map((door) => (
            <div key={door.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">{door.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-slate-600">{door.line}</p>
              {door.keys.map((key) => (
                <p key={key.role} className="mt-4 text-sm text-slate-500">
                  {key.note}
                </p>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-4 text-base text-slate-600">
          Viewer reads whatever the plan includes and cannot upload or confirm. That is not another door.
        </p>
      </section>

      <section id="datasets" className="mt-16 scroll-mt-24">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Included, not a separate invoice</h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-3">
          <div id="rules" className="scroll-mt-24">
            <h3 className="text-xl font-medium tracking-tight text-slate-900">Rules</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              A library for the places on your file. Federal cards ride along once any place is
              present. A card chips when it is inside the time window. Signed-in only.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-medium tracking-tight text-slate-900">Datasets</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              One cleaned file, reused by Equity, Cycle, and Philosophy. The public demo does not
              keep uploads.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-medium tracking-tight text-slate-900">Resume tally</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Lives on Closer. A Tracker-only plan does not open it. Talent and the suite do,
              because they hold Closer.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">The four invoices</h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Suite is $499 a month and includes all four. A Talent workspace can be Tracker and
          Closer together. That is those two prices, not a fifth product. Job Match is included
          with Cleaner or Equity. It is not an invoice.
        </p>
        <ul className="mt-8">
          {invoices.map((row) => (
            <li key={row.name} className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-200 py-5">
              <span>
                <span className="text-xl font-medium tracking-tight text-slate-900">{row.name}</span>
                <span className="mt-1 block text-base text-slate-600">{row.note}</span>
              </span>
              <span className="text-xl tabular-nums text-slate-800">{row.price}/mo</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-medium text-white hover:bg-ember-deep"
          >
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Pricing
          </Link>
          <Link href="/muse" className="px-2 py-2.5 text-sm text-slate-600 hover:text-slate-900">
            Muse connector
          </Link>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600">
          Muse can propose a clean, a placement, an audit, a pool, a four-year total, and a short
          brief. It cannot post pay. Humans do that.
        </p>
      </section>
    </div>
  );
}
