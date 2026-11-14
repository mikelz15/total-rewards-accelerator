"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OrgBrandMark } from "@/components/OrgBrandMark";
import type { WorkspaceTheme } from "@/components/workspace-theme";
import type { Permissions } from "@/lib/permissions";
import { canUseModule } from "@/lib/permissions";
import { navHrefsForRole, showDatasets, showRules } from "@/lib/paths";
import { planPhrase, primaryNavForRole } from "@/lib/workspace-shell";

const toolLinks = [
  { href: "/app/offer-letter", label: "Offer Letter" },
  { href: "/formula-evaluator", label: "Evaluator" },
  { href: "/muse", label: "Muse" },
];

export function AppNav({
  orgName,
  email,
  permissions,
  isSystemAdmin,
  brandImageUrl,
  plan,
  theme,
  onTheme,
}: {
  orgName?: string;
  brandImageUrl?: string | null;
  email?: string | null;
  permissions?: Permissions | null;
  isSystemAdmin?: boolean;
  plan?: string | null;
  theme: WorkspaceTheme;
  onTheme: (theme: WorkspaceTheme) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1100px)");
    const apply = () => setCompact(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

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
  const primary = primaryNavForRole(role).map((link) => {
    const locked =
      link.module && permissions ? !canUseModule(permissions, link.module) : false;
    return { ...link, locked };
  });

  const more = [
    ...(showDatasets(role) && hrefAllowed(allowed, "/app/datasets")
      ? [{ href: "/app/datasets", label: "Datasets" }]
      : []),
    ...(hrefAllowed(allowed, "/app/philosophy")
      ? [{ href: "/app/philosophy", label: "Philosophy" }]
      : []),
    ...(showRules(role) ? [{ href: "/app/governance", label: "Rules" }] : []),
    ...(hrefAllowed(allowed, "/app/workbook") ? [{ href: "/app/workbook", label: "Playbook" }] : []),
    ...toolLinks,
    ...(role === "hrbp" || role === "executive"
      ? []
      : [
          { href: "/app/team", label: "Team" },
          { href: "/app/billing", label: "Billing" },
        ]),
    ...(permissions?.can_manage_team ? [{ href: "/app/settings/branding", label: "Branding" }] : []),
    ...(isSystemAdmin ? [{ href: "/app/admin", label: "Admin" }] : []),
  ];

  const row = compact ? [] : primary;
  const menu = compact ? [...primary.map(({ href, label }) => ({ href, label })), ...more] : more;

  function active(href: string) {
    return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
  }

  const bar =
    theme === "dark"
      ? "border-[#1f6f72] bg-[#132433] text-[#e7eef3]"
      : "border-[#0f6b6d] bg-white/95 text-slate-900";
  const quiet = theme === "dark" ? "text-[#b7c6d0] hover:bg-white/10" : "text-slate-600 hover:bg-slate-100";
  const pill =
    theme === "dark" ? "bg-white text-[#0f1b26]" : "bg-slate-900 text-white";

  return (
    <header className={`sticky top-0 z-50 border-b-2 backdrop-blur ${bar}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <OrgBrandMark src={brandImageUrl} orgName={orgName} />
          <Link href="/app" className="hidden min-w-0 md:block">
            <span className="block truncate text-sm font-semibold">{orgName || "Workspace"}</span>
            <span className={`block truncate text-[10px] font-semibold uppercase tracking-[0.14em] ${theme === "dark" ? "text-[#7ec8c4]" : "text-teal-800"}`}>
              {planPhrase(plan)}
            </span>
          </Link>
        </div>
        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/app"
            className={`rounded-full px-3 py-1.5 text-sm ${active("/app") ? pill : quiet}`}
          >
            Dashboard
          </Link>
          {row.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-sm ${
                active(link.href) ? pill : link.locked ? "text-slate-400" : quiet
              }`}
              title={link.locked ? "Locked by plan or role" : undefined}
            >
              {link.label}
              {link.locked ? " 🔒" : ""}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${quiet}`}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((open) => !open)}
            >
              More
            </button>
            {moreOpen && (
              <div
                role="menu"
                className={`absolute right-0 z-20 mt-2 w-48 rounded-xl border p-1 shadow-lg ${
                  theme === "dark"
                    ? "border-[#2a4154] bg-[#162636] text-[#e7eef3]"
                    : "border-slate-200 bg-white text-slate-800"
                }`}
              >
                {menu.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active(link.href)
                        ? theme === "dark"
                          ? "bg-white/10"
                          : "bg-slate-100"
                        : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div
            className={`ml-1 flex items-center rounded-full border p-0.5 ${
              theme === "dark" ? "border-[#2a4154]" : "border-slate-200"
            }`}
            role="group"
            aria-label="Theme"
          >
            <ThemeButton
              label="Light"
              pressed={theme === "light"}
              onClick={() => onTheme("light")}
              theme={theme}
            >
              <SunIcon />
            </ThemeButton>
            <ThemeButton
              label="Dark"
              pressed={theme === "dark"}
              onClick={() => onTheme("dark")}
              theme={theme}
            >
              <MoonIcon />
            </ThemeButton>
          </div>
          <button
            type="button"
            onClick={signOut}
            className={`ml-1 rounded-full border px-3 py-1.5 text-sm ${
              theme === "dark"
                ? "border-[#2a4154] text-[#e7eef3] hover:bg-white/10"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title={email || "Sign out"}
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

function hrefAllowed(allowed: string[] | null, href: string) {
  if (!allowed) return true;
  return allowed.includes(href);
}

function ThemeButton({
  label,
  pressed,
  onClick,
  theme,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  theme: WorkspaceTheme;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
        pressed
          ? theme === "dark"
            ? "bg-white text-[#0f1b26]"
            : "bg-slate-900 text-white"
          : theme === "dark"
            ? "text-[#b7c6d0]"
            : "text-slate-500"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  );
}
