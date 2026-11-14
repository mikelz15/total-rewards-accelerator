import { BOARD, boardOpens, navHrefsForRole, type BoardGate } from "@/lib/paths";
import { roleLabel } from "@/lib/permissions";

export type ShellCard = {
  href: string;
  title: string;
  body: string;
  gate: BoardGate;
};

/** The numbered path on the approved dashboard mock. */
export const WORKFLOW: ShellCard[] = [
  {
    href: "/app/cleaner",
    title: "Cleaner",
    body: "Map the HRIS extract and save it.",
    gate: "cleaner",
  },
  {
    href: "/app/equity",
    title: "Equity + Merit",
    body: "Market mid, expected placement, and the pool.",
    gate: "equity",
  },
  {
    href: "/app/cycle",
    title: "Cycle Lock",
    body: "Range-first envelope, locked to the plan.",
    gate: "equity",
  },
  {
    href: "/app/closer",
    title: "Closer",
    body: "Four-year wealth, the PDF, and resume tally.",
    gate: "closer",
  },
];

/** Tools that sit beside the path. They are not steps. */
export const MORE_TOOLS: ShellCard[] = [
  {
    href: "/app/job-match",
    title: "Job Match",
    body: "One internal job, three external matches.",
    gate: "job_match",
  },
  {
    href: "/app/philosophy",
    title: "Philosophy Check",
    body: "Midpoint, performance, and leftover effects.",
    gate: "equity",
  },
  {
    href: "/app/candidates",
    title: "Tracker",
    body: "Stages, packages, and notes.",
    gate: "tracker",
  },
  {
    href: "/app/datasets",
    title: "Datasets",
    body: "The cleaned file stays here for the next step.",
    gate: "datasets",
  },
  {
    href: "/app/governance",
    title: "Rules",
    body: "The places on the latest file.",
    gate: "rules",
  },
];

/** The six working modules that stay in the nav row. Everything else is under More. */
export const PRIMARY_NAV: {
  href: string;
  label: string;
  module: "cleaner" | "equity" | "tracker" | "closer" | "job_match";
}[] = [
  { href: "/app/cleaner", label: "Cleaner", module: "cleaner" },
  { href: "/app/equity", label: "Equity", module: "equity" },
  { href: "/app/cycle", label: "Cycle", module: "equity" },
  { href: "/app/closer", label: "Closer", module: "closer" },
  { href: "/app/candidates", label: "Tracker", module: "tracker" },
  { href: "/app/job-match", label: "Job Match", module: "job_match" },
];

export function welcomeName(email?: string | null): string | null {
  const local = email?.split("@")[0]?.trim();
  if (!local) return null;
  const first = local.split(/[._+-]/)[0];
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function seatPhrase(role?: string | null): string {
  if (!role) return "Seat";
  if (role === "owner" || role === "admin" || role === "member") {
    return `Rewards ${roleLabel(role)} seat`;
  }
  const label = roleLabel(role);
  return label ? `${label} seat` : "Seat";
}

export function planPhrase(plan?: string | null): string {
  if (!plan) return "Plan";
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

export function workspaceMeta(input: {
  org?: string | null;
  plan?: string | null;
  role?: string | null;
  datasets: number;
  candidates: number;
}): string {
  const files =
    input.candidates === 1 ? "1 candidate file" : `${input.candidates} candidate files`;
  const sets = input.datasets === 1 ? "1 dataset" : `${input.datasets} datasets`;
  return [input.org || "Workspace", planPhrase(input.plan), seatPhrase(input.role), sets, files].join(
    " · "
  );
}

export function cardsForSeat(
  cards: ShellCard[],
  role?: string | null,
  access?: Record<string, boolean>
): ShellCard[] {
  if (!role) return cards;
  return cards.filter((card) => {
    const board = BOARD.find((item) => item.href === card.href);
    if (!board) return false;
    return boardOpens(role, board, access);
  });
}

export function primaryNavForRole(role?: string | null) {
  const allowed = navHrefsForRole(role);
  if (!allowed) return PRIMARY_NAV;
  return PRIMARY_NAV.filter((link) => allowed.includes(link.href));
}

export function stepsCaption(count: number): string {
  if (count === 4) return "Four steps, in order. Everything else is below.";
  if (count === 1) return "One step on this seat. Everything else is below.";
  return `${count} steps, in order. Everything else is below.`;
}
