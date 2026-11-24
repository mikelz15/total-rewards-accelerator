import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    price: "$650",
    delivery: "5 days",
    revisions: "1 revision",
    features: [
      "1 service connected",
      "Up to 5 operations, read-only",
      "Connector doc (setup, commands, limits)",
      "Secure credential setup (API key or OAuth, entered by you — never shared in chat)",
      "Live test runs against sample data",
    ],
  },
  {
    name: "Standard",
    price: "$1,450",
    delivery: "9 days",
    revisions: "1 revision",
    features: [
      "1 service connected",
      "Up to 12 operations, read + write",
      "Connector doc (setup, commands, limits)",
      "Secure credential setup (API key or OAuth, entered by you — never shared in chat)",
      "Live test runs against your test/sandbox data",
      "30-minute handoff walkthrough",
    ],
  },
  {
    name: "Advanced",
    price: "$2,900",
    delivery: "14 days",
    revisions: "2 revisions",
    features: [
      "2 services connected",
      "Up to 20 operations, read + write",
      "Connector doc (setup, commands, limits)",
      "Secure credential setup (API key or OAuth, entered by you — never shared in chat)",
      "Live test runs against your test/sandbox data",
      "Workflow playbook (a written skill your agent follows for repeat tasks)",
      "30-minute handoff walkthrough",
    ],
  },
];

const steps = [
  "Scope call or written brief: the service, its API docs, and the operations that matter.",
  "Auth check: confirm the service supports API-key or OAuth access (the two flows Muse can hold securely).",
  "Build the connector: operations, error handling, and rate-limit pacing.",
  "Test live against your test or sandbox data; you approve any write operations before they run on real data.",
  "Handoff: connector files, the doc, and the walkthrough on Standard and Advanced.",
];

const proof = [
  {
    title: "TRA Muse /v1 API connector",
    body: "Seven live routes — clean, place, audit, fund, closer, brief — in daily use.",
  },
  {
    title: "Resend email-service connector",
    body: "Sending and receiving in production use.",
  },
  {
    title: "MyChart connector scaffold",
    body: "Verified against Denver Health's production FHIR endpoint (appointments + medication orders scope).",
  },
  {
    title: "Muse platform submissions",
    body: "Four connectors submitted to the Muse platform, in review.",
  },
];

const faqs = [
  {
    q: "What exactly is a connector?",
    a: "The piece that lets an AI agent use a service directly — read records, create items, send, update — through that service's API, with your sign-in held securely. Without one, the agent can only use the service's website like a person would.",
  },
  {
    q: "Can you connect a service that only has a website login?",
    a: "No. Muse's secure flow supports API keys and OAuth 2.0. If a service offers neither, I will say so before any order starts.",
  },
  {
    q: "Do you need my password?",
    a: "Never. You enter credentials yourself through a secure prompt; I never see or store them.",
  },
  {
    q: "Who owns the connector?",
    a: "You do. You get the files and the doc; nothing is held back.",
  },
  {
    q: "What if the service changes its API later?",
    a: "The doc records exactly what was built against which API version. Keeping it current afterward is a separate follow-on order.",
  },
  {
    q: "Is this affiliated with Meta or Muse?",
    a: "No. I am an independent consultant. Muse is Meta's product; I build connectors that work with it.",
  },
];

const SCOPE_MAILTO =
  "mailto:mikez@send.totalrewardsaccelerator.com?subject=Connector%20scoping%20session";

export default function ConnectorBuildPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Connector builds
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          A custom Muse connector for your business tool
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          I connect your business tools to your AI agent — securely, documented, and tested
          live — so the agent does real work in your systems instead of just talking about it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={SCOPE_MAILTO}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Book a $65 scoping session
          </a>
          <Link
            href="#pricing"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            See pricing
          </Link>
        </div>
      </div>

      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">What a connector is</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The bridge between an AI agent (Muse) and a service: a CRM, an inbox tool, a
            database, an internal API. With a connector, the agent can read records, create
            items, send, and update through the service&apos;s API — with your sign-in held in
            a secure flow the consultant never sees.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            I design the connection around the operations you actually need, build it against
            the service&apos;s API, test it live, and hand you the connector plus a
            plain-language doc covering setup, every command, and its limits.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">What you get</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>· A working connector scoped to the operations you actually need</li>
            <li>· A plain-language doc: setup, every command, and the limits — stated up front</li>
            <li>· Live test runs against your test/sandbox data before anything touches real data</li>
            <li>· Write actions (sends, posts, charges, deletions) kept behind your approval</li>
            <li>· Full ownership: files and doc are yours, nothing held back</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="font-semibold tabular-nums text-slate-900">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          How I work: credentials are entered by you through a secure flow — never pasted in
          chat, never stored in the connector files. Writes that change data (sends, posts,
          charges, deletions) stay behind your approval, the same way I run my own. What the
          connector cannot do is stated in the doc up front, not discovered later.
        </p>
      </section>

      <section id="pricing" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-semibold text-slate-900">Pricing</h2>
        <p className="mt-1 text-sm text-slate-500">Fixed price per build · USD</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums text-slate-900">
                  {tier.price}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-teal-800">
                Delivery {tier.delivery} · {tier.revisions}
              </p>
              <ul className="mt-3 flex-1 space-y-2 text-sm leading-relaxed text-slate-600">
                {tier.features.map((feature) => (
                  <li key={feature}>· {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Add-ons:</span> a second service on the
          same order, $800, +4 days · 30-minute readout of a finished build, $199, +0 days. No
          fast-delivery add-on — a service with poor API documentation takes the days on the
          tier.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-slate-900">Built and in use</h2>
        <p className="mt-1 text-sm text-slate-500">
          My own working set — all real, all verifiable on request.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {proof.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Honest limits</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
          <li>
            · API-key or OAuth 2.0 services only — Muse&apos;s secure flow supports those two.
            Password-only, session-cookie, and request-signed services cannot be connected, and
            you hear that before any order.
          </li>
          <li>
            · No Muse subscription or third-party API usage charges included. Ongoing
            maintenance after handoff is a separate follow-on — ask if you want the connector
            kept current.
          </li>
          <li>
            · Not affiliated with Meta. Muse is Meta&apos;s product; this is independent
            consulting.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
        <div className="mt-4 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-sm font-semibold text-slate-900">{faq.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <h2 className="font-semibold">First step: a $65 scoping session</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          A 30-minute working session on your tool. Bring the service name and its API docs;
          leave knowing whether it can be connected, which tier fits, and what it would take.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={SCOPE_MAILTO}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Book the scoping session
          </a>
          <Link
            href="/pricing"
            className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            See TRA product pricing
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Or write directly: mikez@send.totalrewardsaccelerator.com
        </p>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        Prices in USD. This service is for a business connecting its own tools or accounts.
      </p>
    </div>
  );
}
