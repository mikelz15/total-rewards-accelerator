"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OrgBrandMark } from "@/components/OrgBrandMark";
import type { Permissions } from "@/lib/permissions";
import { canUseModule } from "@/lib/permissions";
import { navHrefsForRole, showDatasets, showRules } from "@/lib/paths";

const moduleLinks: {
  href: string;
  label: string;
  module?: "cleaner" | "equity" | "tracker" | "closer" | "job_match";
}[] = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/cleaner", label: "Cleaner", module: "cleaner" },
  { href: "/app/job-match", label: "Job Match", module: "job_match" },
  { href: "/app/equity", label: "Equity", module: "equity" },
  { href: "/app/cycle", label: "Cycle", module: "equity" },
  { href: "/app/philosophy", label: "Philosophy", module: "equity" },
  { href: "/app/candidates", label: "Tracker", module: "tracker" },
  { href: "/app/closer", label: "Closer", module: "closer" },
  { href: "/app/datasets", label: "Datasets", module: "cleaner" },
];

export function AppNav({
  orgName,
  email,
  permissions,
  isSystemAdmin,
  brandImageUrl,
}: {
  orgName?: string;
  /** Public URL of the org's uploaded image. Falls back to the TRA mark. */
  brandImageUrl?: string | null;
  email?: string | null;
  permissions?: Permissions | null;
  isSystemAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    router.push("/");
    router.refresh();
  }

  const role = permissions?.role;
  const allowed = navHrefsForRole(role);
  const links = moduleLinks.filter((link) => {
    if (link.href === "/app/datasets") return showDatasets(role);
    if (!allowed) return true;
    return allowed.includes(link.href);
  });
  const settings = [
    ...(showRules(role) ? [{ href: "/app/governance", label: "Rules" }] : []),
    ...(role === "hrbp" || role === "executive"
      ? []
      : [
          { href: "/app/team", label: "Team" },
          { href: "/app/billing", label: "Billing" },
        ]),
    ...(permissions?.can_manage_team ? [{ href: "/app/settings/branding", label: "Branding" }] : []),
    ...(isSystemAdmin ? [{ href: "/app/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <OrgBrandMark src={brandImageUrl} orgName={orgName} />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm text-slate-600">{orgName || "Workspace"}</p>
          </div>
        </div>
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-1">
          {links.map((link) => {
            const locked =
              link.module && permissions
                ? !canUseModule(permissions, link.module)
                : false;
            const active =
              link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${
                  active
                    ? "bg-slate-900 text-white"
                    : locked
                      ? "text-slate-400 hover:bg-slate-50"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                title={locked ? "Locked by plan or role" : undefined}
              >
                {link.label}
                {locked ? " 🔒" : ""}
              </Link>
            );
          })}
          {settings.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${
                  active
                    ? "bg-teal-800 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="rounded-full px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 sm:px-3 sm:text-sm"
          >
            Demo
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="ml-0.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 sm:px-3 sm:text-sm"
            title={email || "Sign out"}
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
