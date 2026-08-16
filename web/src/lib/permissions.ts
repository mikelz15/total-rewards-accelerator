export type ModuleId = "cleaner" | "equity" | "tracker" | "closer";

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
};

export const ROLE_HELP: Record<string, string> = {
  owner: "Full access + billing + team",
  admin: "Full modules + team (no billing)",
  member: "Comp access to all entitled modules",
  ta: "Tracker + Closer only",
  viewer: "Read access (no uploads/edits)",
};
