"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { resetDemoSession, saveCleanResult } from "@/lib/session";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/cleaner", label: "Cleaner" },
  { href: "/auditor", label: "Equity" },
  { href: "/cycle", label: "Cycle" },
  { href: "/philosophy", label: "Philosophy" },
  { href: "/candidates", label: "Tracker" },
  { href: "/closer", label: "Closer" },
  { href: "/paths", label: "Paths" },
  { href: "/muse", label: "Muse API" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [open, setOpen] = useState(false);

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

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/app")
  ) {
    return null;
  }

  function itemClass(active: boolean) {
    return active
      ? "text-sm font-medium text-slate-900"
      : "text-sm text-slate-600 hover:text-slate-900";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        <BrandLogo variant="nav" priority />
        <nav className="hidden items-center gap-3.5 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={itemClass(pathname === link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50"
            title="Clear session data and reload the messy HRIS sample"
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
          <Link href="/app" className="text-sm text-slate-600 hover:text-slate-900">
            Open app
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-ember px-3.5 py-2 text-sm font-medium text-white hover:bg-ember-deep"
          >
            Start free trial
          </Link>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-slate-800 lg:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={itemClass(pathname === link.href)}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="text-left text-sm text-slate-500"
            >
              {resetting ? "Resetting…" : "Reset demo"}
            </button>
            <Link href="/app" className="text-sm text-slate-600" onClick={() => setOpen(false)}>
              Open app
            </Link>
            <Link href="/signup" className="text-sm font-medium text-ember" onClick={() => setOpen(false)}>
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
