import type { Metadata } from "next";
import Link from "next/link";
import { DesignPartnerForm } from "@/components/DesignPartnerForm";

export const metadata: Metadata = {
  title: "Design Partner Year · Total Rewards Accelerator",
  description:
    "Official rules for the Design Partner Year: one year free + up to 5 licenses for 3 companies. Applications open December 1, 2026. Winners announced January 2, 2027.",
};

export default function ContestPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Design Partner Year
      </h1>
      <p className="mt-6 text-xl leading-relaxed text-slate-600">Applications open December 1, 2026. Winners announced January 2, 2027.</p>

      <div className="mt-12 space-y-10 text-lg leading-relaxed text-slate-700">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">The offer</h2>
          <p className="mt-2">
            Three companies will receive one year of Total Rewards Accelerator free, with up to 5 licenses each.
            This is a selective program, not a raffle. Applications open December 1, 2026. Winners are announced January 2, 2027.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">To apply</h2>
          <p className="mt-2">Submit the following:</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Company name, industry, HQ or primary work state(s), and approximate headcount in scope</li>
            <li>Your name, title, work email, and role in the decision (decision-maker, influencer, or researcher); phone is optional</li>
            <li>Name and title of the executive sponsor (comp, Total Rewards, or HR leader)</li>
            <li>Your primary HRIS or payroll system, how you handle comp today (spreadsheets, tools, or both), and how messy your exports are</li>
            <li>Your top problem: merit cycle hours, pay equity or EPA readiness, messy HRIS data, offer competitiveness, or job architecture</li>
            <li>When your next merit cycle or comp review happens (month or quarter)</li>
            <li>How you will measure success (hours saved, cycle time, audit readiness, or your own measure)</li>
            <li>Whether you would consider a paid Design Partnership or a short pilot if not selected</li>
            <li>Optional: budget path in the next 90 days, which module you would start with, and Denver / Front Range presence</li>
            <li>Confirmation that you have tried the sample-data demo at totalrewardsaccelerator.com, and that you commit to the winner obligations below if selected</li>
            <li><strong>A short paragraph (100–150 words) answering: “What will you do with the extra time TRA saves you?”</strong></li>
          </ul>
          <p className="mt-3">
            Guidance for the paragraph: TRA is built so no comp action takes more than three clicks. Tell us where the time you save on merit cycles, data cleanup, or equity work will go instead. Be specific (coaching managers, fixing job architecture, closing pay gaps, improving offers, etc.). We are looking for real plans. Your answer may be quoted, with permission, if selected.
          </p>
          <DesignPartnerForm />
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">What winners commit to</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>A 30-minute kickoff and a monthly 30-minute feedback session</li>
            <li>Using TRA in at least one live comp cycle or review during the year</li>
            <li>Tracking before-and-after numbers on time spent and steps taken</li>
            <li>Participating in a case study at the end of the year (can be anonymized)</li>
            <li>Sharing feedback on features and workflow that shapes the product roadmap</li>
            <li>Allowing anonymized, aggregated usage insights to improve the product</li>
            <li>Optional: logo or reference call (with your approval)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">After the free year</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Renewal conversation at Full Suite pricing ($499/mo or $4,990/yr). No auto-renewal without a signed agreement.</li>
            <li>A 60-day renewal review that compares results to the success measure you named in your application</li>
            <li>First access to a Design Partnership (custom system starting around $50,000) for teams that want a build fitted to their grades, rules, and data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Selection and non-winners</h2>
          <p className="mt-2">
            Selection is based on fit, specificity of the time-savings plan, willingness to contribute feedback and a case study, and overall readiness. Top-scoring applicants who do not win are offered a paid pilot or Design Partnership conversation. Everyone else receives continued access to the demo and updates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Design Partnership (available now)</h2>
          <p className="mt-2">
            Separate from the contest: a limited number of Design Partnerships are open now for teams that want a custom system built on their data, grades, and merit rules (starting around $50,000). The same three-click, explainable approach applies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Fine print</h2>
          <p className="mt-2">
            Licenses are for the Full Suite unless otherwise agreed. TRA outputs are decision support; you remain responsible for pay decisions and compliance. The program may be modified or canceled before applications open. Official rules are as published on this page. Questions: use the contact path shown in the product or LinkedIn.
          </p>
        </section>
      </div>

      <p className="mt-12 text-base">
        <Link href="/" className="font-medium text-teal-700 hover:underline">
          ← Back to home
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/pricing" className="font-medium text-teal-700 hover:underline">
          Pricing
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/about" className="font-medium text-teal-700 hover:underline">
          About
        </Link>
      </p>
    </div>
  );
}
