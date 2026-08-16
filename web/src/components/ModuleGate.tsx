"use client";

import Link from "next/link";
import type { ModuleId, Permissions } from "@/lib/permissions";
import { MODULE_LABELS, canUseModule } from "@/lib/permissions";
import { Card } from "@/components/ModuleShell";

export function ModuleGate({
  module,
  permissions,
  children,
}: {
  module: ModuleId;
  permissions: Permissions | null;
  children: React.ReactNode;
}) {
  if (canUseModule(permissions, module)) {
    return <>{children}</>;
  }

  const planHas =
    permissions &&
    !permissions.suspended &&
    (permissions.plan_modules?.includes(module) ?? false);
  const label = MODULE_LABELS[module];

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
        {permissions?.suspended ? "Suspended" : planHas ? "Role restricted" : "Upgrade required"}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{label} is locked</h2>
      <p className="mt-2 text-sm text-slate-600">
        {permissions?.suspended
          ? "This organization is suspended. Contact support or your platform admin."
          : planHas
            ? `Your role (${permissions?.role}) cannot open ${label}. Ask an org owner/admin to change your role.`
            : `Your plan (${permissions?.plan || "—"}) does not include ${label}. Upgrade in Billing or ask your admin.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!planHas && (
          <Link
            href="/app/billing"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            View billing
          </Link>
        )}
        <Link
          href="/app/team"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Team & roles
        </Link>
        <Link href="/app" className="rounded-xl px-4 py-2.5 text-sm font-medium text-teal-800">
          Dashboard
        </Link>
      </div>
    </Card>
  );
}
