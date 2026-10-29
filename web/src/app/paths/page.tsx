import type { Metadata } from "next";
import Link from "next/link";
import { SEAT_PATHS } from "@/lib/paths";

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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Paths</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          Same modules. The seat chooses the door.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          A plan decides what the workspace paid for. A seat decides which of those modules
          this person opens, and whether they can change anything.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        {SEAT_PATHS.map((path) => (
          <section key={path.id} id={path.id} className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{path.title}</h2>
              <p className="text-sm text-slate-500">{path.who}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600">{path.line}</p>
            <ol className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {path.steps.map((step, index) => (
                <li key={`${path.id}-${step.label}`} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6">
                  <span className="text-sm tabular-nums text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <Link href={step.href} className="font-medium text-slate-900 hover:underline">
                      {step.label}
                    </Link>
                    <span className="mt-1 block text-sm leading-relaxed text-slate-600">{step.note}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section id="seats" className="mt-16 scroll-mt-24">
        <h2 className="text-xl font-semibold text-slate-900">Who holds the keys</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Owner, admin, and member share the rewards path. The difference is the keys, not the modules.
          A viewer reads whatever the plan includes and cannot upload or confirm.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Seat</th>
                <th className="px-4 py-3 font-medium">Opens</th>
                <th className="px-4 py-3 font-medium">Keys</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">Owner</td>
                <td className="px-4 py-3">Rewards path, inside the plan</td>
                <td className="px-4 py-3">Billing and team</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">Admin</td>
                <td className="px-4 py-3">Rewards path, inside the plan</td>
                <td className="px-4 py-3">Team. Not billing.</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">Member</td>
                <td className="px-4 py-3">Rewards path, inside the plan</td>
                <td className="px-4 py-3">The work. Not team or billing.</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">TA</td>
                <td className="px-4 py-3">Tracker, resume tally, Closer</td>
                <td className="px-4 py-3">No pay file, Equity, Cycle, or Rules</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">HRBP</td>
                <td className="px-4 py-3">Closer and the Equity group line</td>
                <td className="px-4 py-3">No team, billing, Cycle, or Rules</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">Executive</td>
                <td className="px-4 py-3">Offers, Cycle, Philosophy, Rules</td>
                <td className="px-4 py-3">Read only</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">Viewer</td>
                <td className="px-4 py-3">Whatever the plan includes</td>
                <td className="px-4 py-3">Read only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="datasets" className="mt-16 scroll-mt-24">
        <h2 className="text-sm font-medium text-slate-900">Included, not a separate invoice</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <div id="rules" className="scroll-mt-24">
            <h3 className="text-sm font-medium text-slate-900">Rules</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A library for the places on your file. Federal cards ride along once any place is
              present. A card chips when it is inside the time window. Signed-in only.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">Datasets</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              One cleaned file, reused by Equity, Cycle, and Philosophy. The public demo does not
              keep uploads.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">Resume tally</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Lives on Closer. A Tracker-only plan does not open it. Talent and the suite do,
              because they hold Closer.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-sm font-medium text-slate-900">The four invoices</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Suite is $499 a month and includes all four. A talent workspace can be Tracker and
          Closer together. That is those two prices, not a fifth product.
        </p>
        <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {invoices.map((row) => (
            <li key={row.name} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
              <span>
                <span className="font-medium text-slate-900">{row.name}</span>
                <span className="mt-1 block text-sm text-slate-600 sm:mt-0 sm:ml-3 sm:inline">
                  {row.note}
                </span>
              </span>
              <span className="tabular-nums text-slate-700">{row.price}/mo</span>
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
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
          Muse can propose a clean, a placement, an audit, a pool, a four-year total, and a short
          brief. It cannot post pay. Humans do that.
        </p>
      </section>
    </div>
  );
}
