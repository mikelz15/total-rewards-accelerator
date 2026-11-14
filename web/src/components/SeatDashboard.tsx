"use client";

import Link from "next/link";
import type { DatasetSummary, MeResponse } from "@/lib/saas-api";
import {
  MORE_TOOLS,
  WORKFLOW,
  cardsForSeat,
  stepsCaption,
  welcomeName,
  workspaceMeta,
  type ShellCard,
} from "@/lib/workspace-shell";

const QUIET = [
  { href: "/app/workbook", label: "Playbook" },
  { href: "/app/settings/branding", label: "Branding" },
  { href: "/app/offer-letter", label: "Offer Letter" },
  { href: "/formula-evaluator", label: "Evaluator" },
  { href: "/muse", label: "Muse" },
  { href: "/app/team", label: "Team" },
  { href: "/app/billing", label: "Billing" },
];

export function SeatDashboard({
  me,
  loading,
  datasets,
  candidateCount,
}: {
  me: MeResponse | null;
  loading: boolean;
  datasets: DatasetSummary[];
  candidateCount: number;
  offerCount: number | null;
  governance: unknown;
}) {
  const role = me?.membership.role;
  const access = me?.permissions?.module_access;
  const workflow = cardsForSeat(WORKFLOW, role, access);
  const tools = cardsForSeat(MORE_TOOLS, role, access);
  const name = welcomeName(me?.user.email);
  const quiet = QUIET.filter((link) => {
    if (link.href === "/app/settings/branding") return Boolean(me?.permissions?.can_manage_team);
    if (link.href === "/app/team" || link.href === "/app/billing") {
      return role !== "hrbp" && role !== "executive";
    }
    return true;
  });

  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          {name ? `Welcome back, ${name}` : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {loading && !me
            ? "Opening the workspace…"
            : workspaceMeta({
                org: me?.org.name,
                plan: me?.org.plan,
                role,
                datasets: datasets.length,
                candidates: candidateCount,
              })}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href="/app/start"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Start the steps →
          </Link>
          <p className="text-sm text-slate-500">{stepsCaption(workflow.length || 4)}</p>
        </div>
      </div>

      {workflow.length > 0 && (
        <section>
          <SectionHead title="The workflow" note="Clean → check → lock → close" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workflow.map((card, index) => (
              <FlowCard key={card.href} card={card} index={index + 1} total={workflow.length} />
            ))}
          </div>
        </section>
      )}

      {tools.length > 0 && (
        <section>
          <SectionHead title="More tools" note="Use any time — not part of the sequence" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((card) => (
              <ToolCard key={card.href} card={card} />
            ))}
          </div>
        </section>
      )}

      <div className="border-t border-slate-200 pt-4 text-sm text-slate-500">
        <span className="mr-3 text-slate-700">Also in this workspace</span>
        {quiet.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? <span className="px-1.5 text-slate-300">·</span> : null}
            <Link href={link.href} className="hover:text-teal-800">
              {link.label}
            </Link>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
        <span className="hidden h-px w-14 bg-slate-300 sm:block" />
      </h2>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

function FlowCard({ card, index, total }: { card: ShellCard; index: number; total: number }) {
  return (
    <Link
      href={card.href}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-700"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-sm font-semibold text-white">
        {index}
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{card.title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-600">{card.body}</p>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-800">
        Step {index} of {total}
      </p>
    </Link>
  );
}

function ToolCard({ card }: { card: ShellCard }) {
  return (
    <Link
      href={card.href}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-700"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <ToolMark href={card.href} />
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{card.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{card.body}</p>
    </Link>
  );
}

function ToolMark({ href }: { href: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true };
  if (href.endsWith("job-match")) {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16l5 5" />
      </svg>
    );
  }
  if (href.endsWith("philosophy")) {
    return (
      <svg {...common}>
        <path d="M12 4v16M7 8h10M8 16h8" />
      </svg>
    );
  }
  if (href.endsWith("candidates")) {
    return (
      <svg {...common}>
        <path d="M8 7h12M8 12h12M8 17h12" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    );
  }
  if (href.endsWith("datasets")) {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="7" rx="7" ry="3" />
        <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
        <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v4h4" />
    </svg>
  );
}
