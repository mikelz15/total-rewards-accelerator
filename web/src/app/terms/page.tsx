import Link from "next/link";

export const metadata = {
  title: "Terms of Service · Total Rewards Accelerator",
  description:
    "Terms of service for the Total Rewards Accelerator web app, API, and Muse connector.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: September 26, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">The product</h2>
          <p className="mt-2">
            Total Rewards Accelerator (“TRA,” “we,” “us”) is a compensation toolkit operated by
            Mikéz / Michael Lopez. It helps professionals clean files, estimate position-in-range
            from years of experience and education, review equity risk, model merit pools, and
            project multi-year total wealth. Outputs are decision support. You remain responsible
            for pay decisions, legal compliance, and anything you send to employees or candidates.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Accounts and plans</h2>
          <p className="mt-2">
            You must be 18 or older and use the product for legitimate business compensation work.
            Promotional trials may require a card and can be canceled as shown at checkout. Abuse of
            the public demo — including real unscrubbed employee files, scraping, or exceeding
            upload caps — can close access.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2>
          <p className="mt-2">
            Do not upload data you are not allowed to process. Do not bypass sensitive-header scans.
            Do not use TRA to post salary ranges, send offers, or write to an HRIS unless a later
            product version explicitly enables that under your own confirm-chip / approval rules. Do
            not represent TRA outputs as a legal determination of discrimination or as legal,
            accounting, or employment advice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Agents, including Muse</h2>
          <p className="mt-2">
            If you connect an agent such as Meta Muse, you authorize that agent to call TRA with the
            scopes of your API key or account session. TRA treats agent calls as proposals: clean,
            place, audit, fund, closer, and narrative brief. TRA will not treat an agent request as
            approval to email a candidate or change a system of record. You must review proposed pay
            actions before they are posted in your company process.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Intellectual property</h2>
          <p className="mt-2">
            We own TRA, the Placement Engine, and related marks. You own your files and the outputs
            generated from them. You grant us a limited license to process those files solely to
            provide the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
          <p className="mt-2">
            Fees are charged through Stripe as displayed at purchase. Taxes may apply. Chargebacks
            for legitimate use after a trial may close the workspace.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Disclaimer and limit</h2>
          <p className="mt-2">
            The service is provided as available. Compensation work has legal and financial
            consequences. To the extent allowed by Colorado law, liability is limited to fees you
            paid us in the prior three months for the product giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Changes</h2>
          <p className="mt-2">
            We may update these terms and will revise the “Last updated” date above when we do.
            Continued use after notice is acceptance. Governing law: State of Colorado, United
            States.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions: use the pilot channel associated with Total Rewards Accelerator / Mikéz, or
            the support path shown in the product.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/privacy" className="font-medium text-teal-700 hover:underline">
          Privacy Policy
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/" className="font-medium text-teal-700 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
