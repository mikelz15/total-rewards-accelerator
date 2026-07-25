"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { resetDemoSession, saveCleanResult } from "@/lib/session";

const links = [
  { href: "/", label: "Home" },
  { href: "/cleaner", label: "Cleaner" },
  { href: "/auditor", label: "Equity + Merit" },
  { href: "/candidates", label: "Candidate Tracker" },
  { href: "/closer", label: "Closer" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function handleResetDemo() {
    if (resetting) return;
    setResetting(true);
    try {
      resetDemoSession();
      const cleaned = await api.cleanerSample();
      saveCleanResult(cleaned);
      router.push("/cleaner");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not reset demo");
    } finally {
      setResetting(false);
    }
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-slate-900 group-hover:text-teal-700">
            Total Rewards Accelerator
          </span>
          <span className="text-[11px] text-slate-500">Mikéz Comp Engineering Toolkit</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            className="ml-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 transition hover:bg-teal-100 disabled:opacity-50"
            title="Clear session data and reload the messy HRIS sample"
          >
            {resetting ? "Resetting…" : "Reset demo"}
          </button>
        </nav>
      </div>
    </header>
  );
}
