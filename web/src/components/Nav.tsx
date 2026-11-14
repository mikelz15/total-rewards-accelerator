"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { resetDemoSession, saveCleanResult } from "@/lib/session";
import { BrandLogo } from "@/components/BrandLogo";

const primary = [
  { href: "/paths", label: "Paths" },
  { href: "/pricing", label: "Pricing" },
  { href: "/store", label: "Store" },
  { href: "/about", label: "About" },
];

const tools = [
  { href: "/cleaner", label: "Cleaner", line: "Map the extract." },
  { href: "/auditor", label: "Equity", line: "Midpoint and the pool." },
  { href: "/cycle", label: "Cycle", line: "Range-first merit." },
  { href: "/philosophy", label: "Philosophy", line: "Does the file match the story." },
  { href: "/candidates", label: "Tracker", line: "The pipeline." },
  { href: "/closer", label: "Closer", line: "Four-year total wealth." },
  { href: "/formula-evaluator", label: "Evaluator", line: "Flags on a merit file." },
  { href: "/muse", label: "Muse", line: "Propose only. Humans post pay." },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

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
      ? "rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
      : "rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100";
  }

  function closeAll() {
    setOpen(false);
    setToolsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#0f6b6d] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <BrandLogo variant="nav" priority />
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          <div className="relative">
            <button
              type="button"
              className={itemClass(toolsOpen || tools.some((tool) => pathname === tool.href))}
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
              onClick={() => setToolsOpen((value) => !value)}
            >
              Tools
            </button>
            {toolsOpen && (
              <div
                role="menu"
                className="absolute left-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              >
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    role="menuitem"
                    className="block rounded-lg px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                    onClick={closeAll}
                  >
                    <span className="block font-medium">{tool.label}</span>
                    <span className="block text-slate-500">{tool.line}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {primary.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={itemClass(pathname === link.href)}
              onClick={() => setToolsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            className="rounded-full px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            title="Clear session data and reload the messy HRIS sample"
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
          <Link href="/app" className="rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Open app
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-ember px-3 py-1.5 text-sm font-medium text-white hover:bg-ember-deep"
          >
            Start free trial
          </Link>
        </div>
        <button
          type="button"
          className="ml-auto text-sm font-medium text-slate-800 lg:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Tools</p>
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                onClick={closeAll}
              >
                {tool.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-slate-200" />
            {primary.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={itemClass(pathname === link.href)}
                onClick={closeAll}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="rounded-lg px-3 py-2 text-left text-sm text-slate-500"
            >
              {resetting ? "Resetting…" : "Reset demo"}
            </button>
            <Link href="/app" className="rounded-lg px-3 py-2 text-sm text-slate-600" onClick={closeAll}>
              Open app
            </Link>
            <Link href="/signup" className="rounded-lg px-3 py-2 text-sm font-medium text-ember" onClick={closeAll}>
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
