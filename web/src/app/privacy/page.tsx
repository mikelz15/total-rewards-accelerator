import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · Total Rewards Accelerator",
  description: "Privacy policy for the Total Rewards Accelerator web and mobile apps.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: September 26, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
          <p className="mt-2">
            Total Rewards Accelerator (“TRA,” “we,” “us”) is a compensation engineering toolkit
            provided by Mikéz / Michael Lopez for demo, design-partner, and product use via web and
            mobile applications. This policy describes how information is handled.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Public demo environment</h2>
          <p className="mt-2">
            The public demo is designed for sample and synthetic data only. Uploads may be limited
            in size, scanned for sensitive column headers, and rate-limited. Do not upload real
            unscrubbed employee, candidate, or patient files to the public demo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Information we process</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account / contact data</strong> you voluntarily provide (e.g. pilot inquiries).
            </li>
            <li>
              <strong>Usage data</strong> such as device type, app version, crash logs, and basic
              analytics if enabled.
            </li>
            <li>
              <strong>Push notification tokens</strong> if you enable notifications on mobile.
            </li>
            <li>
              <strong>Files and HRIS-style records</strong> you choose to upload or paste into the
              product (customer / pilot deployments only; public demo is sample-first).
            </li>
            <li>
              <strong>Connector credentials</strong> such as workspace API keys when you connect an
              agent (including Meta Muse).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How we use information</h2>
          <p className="mt-2">
            To operate the Cleaner, Equity + Merit, Candidate Tracker, and Closer modules; improve
            reliability and security; respond to support and pilot requests; and send optional
            product reminders if you enable notifications. We do not sell personal information. We
            do not use customer compensation files to train public models.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Muse and other agents</h2>
          <p className="mt-2">
            If you connect TRA to Muse or another agent, that agent sends only the prompts and files
            you authorize. TRA returns mappings, placement tables, audit notes, pool math, and PDF
            links. TRA does not post salary ranges, email candidates, or write to your HRIS through
            the v1 connector. You can revoke a workspace API key at any time. We do not use Muse
            conversation content for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Sharing</h2>
          <p className="mt-2">
            We use infrastructure providers (e.g. hosting, payments, and app distribution platforms)
            to run the service. We do not sell personal information. Data may be disclosed if
            required by law or to protect rights and safety. When Muse is connected, TRA shares with
            Meta only the minimum a connected request needs to complete the tool call you started.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Retention & security</h2>
          <p className="mt-2">
            Demo processing is ephemeral where feasible. Customer pilots may retain data under
            separate agreements. We apply reasonable technical and organizational measures; no
            method of transmission is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your choices</h2>
          <p className="mt-2">
            You may decline optional notifications, avoid uploading personal data to the public
            demo, disconnect an agent by deleting its API key, and request deletion of pilot data by
            contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Children</h2>
          <p className="mt-2">
            TRA is a business productivity product and is not directed to children under 18.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about this policy: contact the operator via the pilot channel associated with
            Total Rewards Accelerator / Mikéz (e.g. LinkedIn DM or email provided in pilot materials).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Changes</h2>
          <p className="mt-2">
            We may update this policy and will revise the “Last updated” date above when we do.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/terms" className="font-medium text-teal-700 hover:underline">
          Terms of Service
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/" className="font-medium text-teal-700 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
