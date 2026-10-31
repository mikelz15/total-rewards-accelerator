import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Total Rewards Accelerator",
  description:
    "Total Rewards Accelerator is a compensation toolkit. Michael Lopez built it from cleaning pay files, placing people, funding gaps, and closing offers.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">About</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        A compensation toolkit, built from the work
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Total Rewards Accelerator is for the people who run pay. The sequence does not change.
        Clean the file. Place the person. Fund the gap. Close the offer.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">The company</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            Rewards, HR, and talent leaders still do this in exports and workbooks. TRA is the
            toolkit for that cycle. Cleaner turns a messy HRIS file into records you can use.
            Equity and Philosophy Check look at whether pay matches the story you tell. Cycle Lock
            runs a range-first merit pool. Tracker and Closer carry a candidate from the pipeline
            to a four-year view of the offer.
          </p>
          <p>
            The modules can stand alone or sit together as a suite. Cycle Lock and Philosophy Check
            are included with Equity. Resume tally is included with Closer. They are not extra
            invoices.
          </p>
          <p>
            The public pages run on a sample. A signed-in workspace is where your own file stays.
            Do not put a real employee or candidate file on the demo.
          </p>
          <p>
            The practice behind the product is Mikéz L.L. HR &amp; Lean Global Solutions. TRA is
            the part of that practice that repeats.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/pricing" className="text-slate-900 hover:underline">
            Pricing
          </Link>
          <Link href="/paths" className="text-slate-900 hover:underline">
            Paths
          </Link>
          <Link href="/signup" className="text-slate-900 hover:underline">
            Start a trial
          </Link>
        </div>
      </section>

      <section className="mt-14 border-t border-slate-200 pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Michael Lopez</h2>
        <p className="mt-2 text-sm text-slate-500">Mikéz · Denver</p>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            Michael Lopez is a compensation partner and a computer scientist. He treats total
            rewards as an operating system: clean the data, place the person, fund the gap, close
            the offer. The product is that system, taken out of the workbook.
          </p>
          <p>
            At Denver Health he priced structures for more than 8,000 employees and set job
            architecture for more than 700 roles. A service-date increase saved $90,000 in the
            first year and moved four people from administration into strategy. Merit administration
            went from 40 hours to 8.
          </p>
          <p>
            On the Lydall and Unifrax combination, above $1 billion, he worked pay for 2,500 people
            in 7 countries. 1,658 job codes came down to 796, on a 25-level global structure.
          </p>
          <p>
            Job architecture, incentives, and Colorado pay-range transparency were the consulting
            work. The pieces that showed up every time became Total Rewards Accelerator.
          </p>
        </div>
        <p className="mt-6 text-sm">
          <a
            href="https://www.linkedin.com/in/mikez-lopez"
            className="font-medium text-slate-900 hover:underline"
          >
            LinkedIn
          </a>
        </p>
      </section>
    </div>
  );
}
