export type ModuleId = "cleaner" | "equity" | "tracker" | "closer" | "job_match";

export type Permissions = {
  plan: string;
  role: string;
  suspended: boolean;
  plan_modules: string[];
  role_modules: string[];
  modules: string[];
  can_write: boolean;
  can_manage_billing: boolean;
  can_manage_team: boolean;
  module_access: Record<string, boolean>;
};

export function canUseModule(perms: Permissions | null | undefined, module: ModuleId): boolean {
  if (!perms || perms.suspended) return false;
  return Boolean(perms.module_access?.[module] || perms.modules?.includes(module));
}

export const MODULE_LABELS: Record<ModuleId, string> = {
  cleaner: "Cleaner",
  equity: "Equity + Merit",
  tracker: "Candidates",
  closer: "Closer",
  job_match: "Job Match",
};

export const ROLE_HELP: Record<string, string> = {
  owner: "Rewards path, plus billing and team",
  admin: "Rewards path and team. No billing.",
  member: "Rewards path, including Job Match. No team and no billing.",
  ta: "Talent path. Tracker, resume tally, and Closer.",
  hrbp: "HRBP path. Place one person, the four-year page, one group line.",
  executive: "Executive path. Read offers, the cycle, philosophy, and rules in force.",
  viewer: "Reads the modules on the plan. No uploads or confirms.",
};
