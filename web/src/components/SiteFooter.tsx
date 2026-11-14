"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isWorkspaceTool, useSignedIn } from "@/lib/use-signed-in";

const links = [
  { href: "/paths", label: "Paths" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contest", label: "Contest" },
  { href: "/muse", label: "Muse" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  if (
    !pathname ||
    pathname.startsWith("/app") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    (isWorkspaceTool(pathname) && signedIn)
  ) {
    return null;
  }

  return (
    <footer className="mt-16 border-t border-[#0f6b6d]/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-sm text-slate-600">
        <span className="text-slate-800">Total Rewards Accelerator</span>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-slate-900">
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
