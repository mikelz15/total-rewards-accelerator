"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import type { Permissions } from "@/lib/permissions";
import { canUseModule } from "@/lib/permissions";

const moduleLinks: {
  href: string;
  label: string;
  module?: "cleaner" | "equity" | "tracker" | "closer";
}[] = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/cleaner", label: "Cleaner", module: "cleaner" },
  { href: "/app/equity", label: "Equity", module: "equity" },
  { href: "/app/candidates", label: "Candidates", module: "tracker" },
  { href: "/app/closer", label: "Closer", module: "closer" },
  { href: "/app/datasets", label: "Datasets", module: "cleaner" },
];

export function AppNav({
  orgName,
  email,
  permissions,
  isSystemAdmin,
}: {
  orgName?: string;
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

  const settings = [
    { href: "/app/team", label: "Team" },
    { href: "/app/billing", label: "Billing" },
    ...(isSystemAdmin ? [{ href: "/app/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo variant="nav" href="/app" priority />
          <div className="hidden min-w-0 sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              Workspace
            </p>
            <p className="truncate text-sm text-slate-700">{orgName || "Loading…"}</p>
          </div>
        </div>
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-1">
          {moduleLinks.map((link) => {
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
