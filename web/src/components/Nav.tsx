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
      ? "text-base font-medium text-slate-900"
      : "text-base text-slate-600 hover:text-slate-900";
  }

  function closeAll() {
    setOpen(false);
    setToolsOpen(false);
  }

  const toolPanel = (
    <div id="site-tools" className="border-t border-slate-200/80 bg-white">
      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            onClick={closeAll}
          >
            <span className="block text-lg font-medium tracking-tight text-slate-900">{tool.label}</span>
            <span className="mt-1 block text-base text-slate-600">{tool.line}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#0f6b6d]/40 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between gap-6 px-5">
        <BrandLogo variant="nav" priority />
        <nav className="hidden items-center gap-7 lg:flex">
          <button
            type="button"
            className={itemClass(tools.some((tool) => pathname === tool.href))}
            aria-expanded={toolsOpen}
            aria-controls="site-tools"
            onClick={() => setToolsOpen((value) => !value)}
          >
            Tools
          </button>
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
        <div className="hidden items-center gap-6 lg:flex">
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            className="text-base text-slate-500 hover:text-slate-900 disabled:opacity-50"
            title="Clear session data and reload the messy HRIS sample"
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
          <Link href="/app" className="text-base text-slate-600 hover:text-slate-900">
            Open app
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-ember px-5 py-2.5 text-base font-medium text-white hover:bg-ember-deep"
          >
            Start free trial
          </Link>
        </div>
        <button
          type="button"
          className="text-base font-medium text-slate-800 lg:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {toolsOpen && <div className="hidden lg:block">{toolPanel}</div>}
      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-6 lg:hidden">
          <div className="flex flex-col gap-5">
            <p className="text-base text-slate-500">Tools</p>
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="text-lg font-medium text-slate-900"
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
              className="text-left text-base text-slate-500"
            >
              {resetting ? "Resetting…" : "Reset demo"}
            </button>
            <Link href="/app" className="text-base text-slate-600" onClick={closeAll}>
              Open app
            </Link>
            <Link href="/signup" className="text-base font-medium text-ember" onClick={closeAll}>
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
