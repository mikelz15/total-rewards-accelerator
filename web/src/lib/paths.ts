/** Seat paths. Modules come from the entitlement engine. This file only names the route. */

export type SeatId = "rewards" | "talent" | "hrbp" | "executive";

export type PathStep = {
  label: string;
  href: string;
  note: string;
};

export type SeatPath = {
  id: SeatId;
  title: string;
  who: string;
  line: string;
  steps: PathStep[];
};

export const SEAT_PATHS: SeatPath[] = [
  {
    id: "rewards",
    title: "Rewards",
    who: "Owner, admin, or member",
    line: "Clean the file, keep it, then design the cycle.",
    steps: [
      {
        label: "Cleaner",
        href: "/cleaner",
        note: "Map the HRIS extract. The shared Placement Engine runs on the cleaned rows.",
      },
      {
        label: "Datasets",
        href: "/app/datasets",
        note: "The cleaned file stays here. The next module opens it. You do not upload it again.",
      },
      {
        label: "Equity + Merit",
        href: "/auditor",
        note: "Market mid and expected placement. Flight risk is a 0–100 score from under-market pay, a strong performer under the range, and tenure. The pool can fund to mid, to expected placement, or to the max of both.",
      },
      {
        label: "Cycle Lock",
        href: "/cycle",
        note: "Included with Equity. Range-first merit on a fixed envelope. Nothing above midpoint unless you confirm the exception.",
      },
      {
        label: "Philosophy Check",
        href: "/philosophy",
        note: "Included with Equity. Scores the file on midpoint, performance, and leftover department effects.",
      },
      {
        label: "Rules",
        href: "/app/governance",
        note: "The places on that file, plus federal cards once any place is present. Not a module and not an invoice.",
      },
    ],
  },
  {
    id: "talent",
    title: "Talent",
    who: "TA seat",
    line: "Credit the resume, then show the four years.",
    steps: [
      {
        label: "Tracker",
        href: "/candidates",
        note: "Stages, offer packages, and notes. Hands a person to Closer.",
      },
      {
        label: "Resume tally",
        href: "/closer",
        note: "Same benchmark is full credit. Same family, or a grade off, is half. A different function is none. Overlap counts once. Confirm fills Years of experience.",
      },
      {
        label: "Closer",
        href: "/closer",
        note: "Base, bonus, and LTI as four-year total wealth, and a one-page PDF.",
      },
    ],
  },
  {
    id: "hrbp",
    title: "HRBP",
    who: "HRBP seat",
    line: "One person, the page for the manager, one line for the group.",
    steps: [
      {
        label: "Place this person",
        href: "/closer",
        note: "Years and education, or a resume tally. Confirm fills Years of experience.",
      },
      {
        label: "Four-year page",
        href: "/closer",
        note: "The manager gets base, bonus, and LTI as one total, and the PDF.",
      },
      {
        label: "The group",
        href: "/auditor",
        note: "One line from the saved pay file. This seat does not run the cycle or open Rules.",
      },
    ],
  },
  {
    id: "executive",
    title: "Executive",
    who: "Executive seat",
    line: "A read. Offers, the cycle, the philosophy, and the rules in force.",
    steps: [
      {
        label: "Offers",
        href: "/closer",
        note: "The four-year page, against expected placement. This seat does not edit.",
      },
      {
        label: "Cycle Lock",
        href: "/cycle",
        note: "The envelope and who is above midpoint.",
      },
      {
        label: "Philosophy Check",
        href: "/philosophy",
        note: "Whether the file matches the stated philosophy.",
      },
      {
        label: "Rules",
        href: "/app/governance",
        note: "What is in force for the places on the latest file.",
      },
    ],
  },
];

const BY_ID = Object.fromEntries(SEAT_PATHS.map((path) => [path.id, path])) as Record<
  SeatId,
  SeatPath
>;

/** null means the full module list. A list is the only links that seat should see. */
const ROLE_NAV: Record<string, string[] | null> = {
  owner: null,
  admin: null,
  member: null,
  viewer: null,
  ta: ["/app", "/app/candidates", "/app/closer"],
  hrbp: ["/app", "/app/equity", "/app/closer"],
  executive: ["/app", "/app/equity", "/app/cycle", "/app/philosophy", "/app/closer"],
};

export function pathForRole(role?: string | null): SeatPath {
  if (role === "ta") return BY_ID.talent;
  if (role === "hrbp") return BY_ID.hrbp;
  if (role === "executive") return BY_ID.executive;
  return BY_ID.rewards;
}

export function navHrefsForRole(role?: string | null): string[] | null {
  if (!role) return null;
  return ROLE_NAV[role] ?? null;
}

/** Datasets are the rewards file library. Talent, HRBP, and Executive do not work from that list. */
export function showDatasets(role?: string | null): boolean {
  return role !== "ta" && role !== "hrbp" && role !== "executive";
}

/** Rules follow a pay file. Talent and HRBP do not open that library. */
export function showRules(role?: string | null): boolean {
  return role !== "ta" && role !== "hrbp";
}

const WORKSPACE_HREF: Record<string, string> = {
  "/cleaner": "/app/cleaner",
  "/auditor": "/app/equity",
  "/cycle": "/app/cycle",
  "/philosophy": "/app/philosophy",
  "/candidates": "/app/candidates",
  "/closer": "/app/closer",
};

export function workspaceHref(href: string): string {
  return WORKSPACE_HREF[href] ?? href;
}

export type BoardGate = "cleaner" | "equity" | "tracker" | "closer" | "datasets" | "rules";

export type BoardCard = {
  step: string;
  href: string;
  title: string;
  body: string;
  seats: string;
  gate: BoardGate;
  /** Roles that open this card. Every seat still sees the card. */
  roles: string[];
};

const REWARDS = ["owner", "admin", "member", "viewer"];

export const BOARD: BoardCard[] = [
  {
    step: "01",
    href: "/app/cleaner",
    title: "Cleaner",
    body: "Map the HRIS extract and save it.",
    seats: "Rewards",
    gate: "cleaner",
    roles: REWARDS,
  },
  {
    step: "02",
    href: "/app/equity",
    title: "Equity + Merit",
    body: "Market mid, expected placement, flight risk, and the pool.",
    seats: "Rewards, HRBP, Executive",
    gate: "equity",
    roles: [...REWARDS, "hrbp", "executive"],
  },
  {
    step: "03",
    href: "/app/cycle",
    title: "Cycle Lock",
    body: "Included with Equity. Range-first envelope. Nothing above midpoint unless you confirm it.",
    seats: "Rewards, Executive",
    gate: "equity",
    roles: [...REWARDS, "executive"],
  },
  {
    step: "—",
    href: "/app/philosophy",
    title: "Philosophy Check",
    body: "Included with Equity. Midpoint, performance, and leftover department effects.",
    seats: "Rewards, Executive",
    gate: "equity",
    roles: [...REWARDS, "executive"],
  },
  {
    step: "04",
    href: "/app/candidates",
    title: "Tracker",
    body: "Stages, packages, and notes.",
    seats: "Rewards, Talent",
    gate: "tracker",
    roles: [...REWARDS, "ta"],
  },
  {
    step: "05",
    href: "/app/closer",
    title: "Closer",
    body: "Four-year wealth, the PDF, and resume tally.",
    seats: "Rewards, Talent, HRBP, Executive",
    gate: "closer",
    roles: [...REWARDS, "ta", "hrbp", "executive"],
  },
  {
    step: "—",
    href: "/app/datasets",
    title: "Datasets",
    body: "The cleaned file stays here for the next step.",
    seats: "Rewards",
    gate: "datasets",
    roles: REWARDS,
  },
  {
    step: "—",
    href: "/app/governance",
    title: "Rules",
    body: "The places on the latest file. Not a separate module.",
    seats: "Rewards, Executive",
    gate: "rules",
    roles: [...REWARDS, "executive"],
  },
];

export function boardOpens(
  role: string | null | undefined,
  card: BoardCard,
  access: Record<string, boolean> | undefined
): boolean {
  if (!role || !card.roles.includes(role)) return false;
  if (card.gate === "datasets" || card.gate === "rules") return true;
  if (!access) return false;
  return Boolean(access[card.gate]);
}
