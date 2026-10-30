"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { SeatPath } from "@/lib/paths";

function shortNote(note: string): string {
  const match = note.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : note).trim();
}

/** Signed-in workspace routes are not public demos. Those steps render as plain labels. */
function demoHref(href: string): string | null {
  return href.startsWith("/app") ? null : href;
}

/**
 * One seat on the homepage. Clean by default.
 * Desktop: hover or keyboard focus expands the module list in place.
 * Touch: the toggle opens and closes the same list, accordion style.
 */
export function SeatPathCard({ path }: { path: SeatPath }) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  // Class names stay literal so Tailwind can see them. The [@media(hover:hover)] variant keeps
  // hover and focus-within expansion off touch screens, where the toggle owns open and closed.
  const reveal = open
    ? "grid-rows-[1fr] visible opacity-100"
    : `grid-rows-[0fr] invisible opacity-0 [@media(hover:hover)]:group-hover:grid-rows-[1fr] [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:grid-rows-[1fr] [@media(hover:hover)]:group-focus-within:visible [@media(hover:hover)]:group-focus-within:opacity-100`;

  return (
    <div
      className={`group rounded-2xl border bg-white p-5 transition-colors motion-reduce:transition-none ${
        open ? "border-slate-300" : "border-slate-200"
      } [@media(hover:hover)]:hover:border-slate-300 focus-within:border-slate-300`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/paths#${path.id}`}
          className="-m-1 block min-w-0 flex-1 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{path.who}</p>
          <h3 className="mt-1 text-base font-medium text-slate-900">{path.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{path.line}</p>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={listId}
          className={`shrink-0 rounded-full border border-slate-200 p-2 text-slate-500 outline-none hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 [@media(hover:hover)]:hidden`}
        >
          <span className="sr-only">
            {open ? "Hide" : "Show"} the {path.title} modules
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div
        id={listId}
        className={`grid transition-all duration-200 ease-out motion-reduce:transition-none ${reveal}`}
      >
        <div className="overflow-hidden">
          <ol className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {path.steps.map((step, index) => {
              const href = demoHref(step.href);
              return (
                <li key={`${step.label}-${index}`} className="flex gap-3 text-sm">
                  <span className="w-5 shrink-0 tabular-nums text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    {href ? (
                      <Link
                        href={href}
                        className="font-medium text-slate-900 underline-offset-2 outline-none hover:text-ember hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ember"
                      >
                        {step.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">
                        {step.label}
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-500">
                          Signed in
                        </span>
                      </span>
                    )}
                    <span className="block text-slate-500">{shortNote(step.note)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
