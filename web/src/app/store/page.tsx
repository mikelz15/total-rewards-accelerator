import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";

const products = [
  {
    name: "Pay-Equity Auditor Template",
    price: "$129",
    blurb: "Gap tables by family and level, LINEST regression on log salary, per-employee flags. Framed as a first-pass screening tool, not a legal audit.",
    gumroad: "https://mikezll.gumroad.com/l/rocvf",
    image: "/store/pay-equity.png",
  },
  {
    name: "4-Year Total Wealth Projector",
    price: "$99",
    blurb: "One offer in, four-year trajectory and a one-page summary out. Does not test against internal equity or ranges.",
    gumroad: "https://mikezll.gumroad.com/l/ekxdhs",
    image: "/store/projector.png",
  },
  {
    name: "Merit and Bonus Workbook",
    price: "$99",
    blurb: "21-point checklist, editable 5x3 merit matrix, merit model with equity-risk flags, bonus model with proration.",
    gumroad: "https://mikezll.gumroad.com/l/ysdqcwe",
    image: "/store/merit-workbook.png",
  },
  {
    name: "Market Data Cleaner Template",
    price: "$79",
    blurb: "Rules-and-formulas layer only (title/location maps, FX, aging, QC flags). Practitioner-run layer, not the TRA Cleaner engine.",
    gumroad: "https://mikezll.gumroad.com/l/kwshs",
    image: "/store/cleaner.png",
  },
  {
    name: "Clean Your HRIS Extract Before a Cycle",
    price: "$49",
    blurb: "5-page PDF guide plus a 2:54 narrated walkthrough film teaching the five cleaning passes.",
    gumroad: "https://mikezll.gumroad.com/l/bbfqc",
    image: "/store/hris-bundle.png",
  },
];

export default function StorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-slate-900">
        <img
          src="/store/comp-toolkit.png"
          alt="TRA Store"
          className="h-48 w-full object-cover opacity-80 sm:h-56"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-900/70 to-transparent px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Standalone tools and templates
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/90">
            Instant download. No subscription required.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <p className="text-lg text-slate-600">
          These are offline or lightweight versions of the modules. Full hosted access with saved datasets and multi-seat workspaces is on the Pricing page.
        </p>
      </div>

      <section className="mt-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="relative mb-4 h-40 overflow-hidden rounded-xl bg-slate-100">
                <ProductImage src={p.image} alt={p.name} />
              </div>
              <h3 className="text-xl font-medium tracking-tight text-slate-900">{p.name}</h3>
              <div className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
                {p.price}
              </div>
              <p className="mt-4 flex-1 text-base leading-relaxed text-slate-600">{p.blurb}</p>
              <a
                href={p.gumroad}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800"
              >
                Buy on Gumroad
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-teal-200 bg-teal-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Formula Evaluator — coming soon</h2>
        <p className="mt-2 text-sm text-slate-700">
          Upload a merit or bonus file and get ranked flags for data, logic, and equity issues. First-pass screening, not a legal determination. Hosted version of the same checks behind the Pay-Equity Auditor template.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-semibold text-slate-900">$59 / month</span>
            <span className="text-slate-600"> add-on to Equity + Merit</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">$69</span>
            <span className="text-slate-600"> one-time run</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Free</span>
            <span className="text-slate-600"> limited (50 rows / 3 checks)</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          MVP checks locked. Build in progress for both the Gumroad one-time and the TRA SaaS add-on.
        </p>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        Prices are one-time for templates. Files are delivered immediately via Gumroad. These tools are for review and planning. They are not legal or compliance determinations. Looking for hosted modules? See <Link href="/pricing" className="underline">Pricing</Link>. Prefer the full auditor? See <Link href="/auditor" className="underline">Equity + Merit</Link>.
      </p>
    </div>
  );
}
