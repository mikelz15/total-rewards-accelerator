import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · Total Rewards Accelerator",
  description:
    "Mikez L.L. Enterprise is a compensation practice. Total Rewards Accelerator is the toolkit Michael Lopez built from that work.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">About</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        The practice, then the toolkit
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Mikez L.L. Enterprise is a compensation practice. The work is the system that pays people.
        Total Rewards Accelerator is that system, taken out of the workbook.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">The company</h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            Rewards, HR, and talent teams still run pay in exports and workbooks. The sequence does
            not change. Clean the file. Place the person. Fund the gap. Close the offer.
          </p>
          <p>
            On the site those steps are Cleaner, Equity, Cycle Lock, Tracker, and Closer. Equity
            asks whether pay matches the story you tell. Closer turns an offer into a four-year view
            of total wealth. Cycle Lock and Philosophy Check sit with Equity. Resume tally sits with
            Closer. They are not extra invoices.
          </p>
          <p>
            The public pages run on a sample. A signed-in workspace is where your own file stays. Do
            not put a real employee or candidate file on the demo.
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
        <p className="mt-2 text-sm text-slate-500">Mikéz · Denver · Mikez L.L. Enterprise</p>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700">
          <p>
            Michael Lopez is a compensation partner and a computer scientist. He built the practice,
            then built the product from the parts of the work that kept repeating.
          </p>
          <p>
            At Denver Health he tied the annual increase to service date. That saved $90,000 in the
            first year and moved four people from administration into strategy. He built a career
            ladder for certified nurse assistants. In HR records he cleared about 3,000 pieces of
            paper a week and took the department to about 90 percent electronic.
          </p>
          <p>
            On the Lydall and Unifrax combination he was principal compensation consultant. The
            deal was above $1 billion: 2,500 people in seven countries, brought onto one pay
            structure in under six months. 1,658 job codes came down to 796. Market data came from
            Mercer, Willis Towers Watson, and ERI, aimed at the middle of the market. Merit
            administration went from 40 hours to 8.
          </p>
          <p>Those repeats are what Total Rewards Accelerator does now.</p>
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
