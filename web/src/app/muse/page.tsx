import Link from "next/link";

export const metadata = {
  title: "Muse connector · Total Rewards Accelerator",
  description:
    "Propose-only compensation API for Meta Muse. Clean, place, audit, fund, and project total wealth. Humans post pay.",
};

export default function MuseConnectorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
        Connector
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        Total Rewards Accelerator for Muse
      </h1>
      <p className="mt-2 text-sm text-slate-500">Propose only. Humans post pay.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What Muse can do</h2>
          <p className="mt-2">
            TRA is a compensation toolkit from Mikéz Comp Engineering. A connected agent can
            clean a compensation file, place people from years of experience and education,
            run a dual-lens equity review, size a merit pool from range penetration, project
            four-year total wealth, and draft a short CHRO brief. Every result is a proposal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">What Muse cannot do</h2>
          <p className="mt-2">
            v1 does not write to an HRIS, post salary ranges, or email a candidate.{" "}
            <code className="text-slate-900">POST /v1/act</code> and{" "}
            <code className="text-slate-900">send_to_candidate: true</code> are refused.
            Files with sensitive headers (such as SSN, date of birth, or home address) are
            rejected. Jobs stay in memory for the review workspace and are not a system of
            record.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Connection</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Type: Raw API</li>
            <li>
              Base:{" "}
              <a
                className="font-medium text-teal-700 hover:underline"
                href="https://tra-api-starter.onrender.com/v1"
              >
                https://tra-api-starter.onrender.com/v1
              </a>
            </li>
            <li>
              OpenAPI:{" "}
              <a
                className="font-medium text-teal-700 hover:underline"
                href="https://tra-api-starter.onrender.com/openapi.json"
              >
                https://tra-api-starter.onrender.com/openapi.json
              </a>
            </li>
            <li>Auth: API key. Header <code className="text-slate-900">Authorization: Bearer …</code></li>
            <li>Payments: Stripe on the TRA site. This connector does not charge inside the tool call.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Verbs</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <code>GET /v1/me</code> — workspace, plan, and that writeback and email are off
            </li>
            <li>
              <code>POST /v1/clean</code> — <code>csv_text</code> or <code>records</code>
            </li>
            <li>
              <code>POST /v1/place</code> — expected position-in-range from the cleaned job
            </li>
            <li>
              <code>POST /v1/audit</code> — dual-lens equity notes
            </li>
            <li>
              <code>POST /v1/fund</code> — merit pool from range penetration, not ratings
            </li>
            <li>
              <code>POST /v1/closer</code> — base, bonus percent, LTI, optional PDF
            </li>
            <li>
              <code>POST /v1/brief</code> — one-page narrative for a CHRO
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Example prompts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Connect Total Rewards Accelerator and confirm which workspace I am in.</li>
            <li>Clean this compensation export. Map columns. Do not invent values.</li>
            <li>Place this population using years of experience and education.</li>
            <li>Run a dual-lens equity audit. List gaps I can defend.</li>
            <li>Build a merit pool that slows increases past midpoint. Show leftover dollars.</li>
            <li>Draft a four-year total-wealth statement. Do not email the candidate.</li>
          </ul>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/privacy" className="font-medium text-teal-700 hover:underline">
          Privacy
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/terms" className="font-medium text-teal-700 hover:underline">
          Terms
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/" className="font-medium text-teal-700 hover:underline">
          ← Home
        </Link>
      </p>
    </div>
  );
}
