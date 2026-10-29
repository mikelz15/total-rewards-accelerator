"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/paths", label: "Paths" },
  { href: "/pricing", label: "Pricing" },
  { href: "/muse", label: "Muse" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (
    !pathname ||
    pathname.startsWith("/app") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <footer className="mt-8 border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-8 text-sm text-slate-500">
        <span className="text-slate-700">Total Rewards Accelerator</span>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-900">
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
