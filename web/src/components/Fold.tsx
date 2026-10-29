"use client";

import Link from "next/link";

/**
 * A title that stays on the page. The sentence opens on click.
 * The link is the name. The rest of the row is the disclosure.
 */
export function Fold({
  kicker,
  title,
  href,
  children,
}: {
  kicker: string;
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-3 open:pb-4">
      <summary className="grid cursor-pointer list-none gap-1 rounded-sm marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 sm:grid-cols-[7rem_1fr] sm:items-baseline sm:gap-6 [&::-webkit-details-marker]:hidden">
        <span className="text-sm tabular-nums text-slate-400">{kicker}</span>
        <span className="flex min-w-0 items-baseline justify-between gap-3">
          {href ? (
            <Link
              href={href}
              className="text-base font-medium text-slate-900 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {title}
            </Link>
          ) : (
            <span className="text-base font-medium text-slate-900">{title}</span>
          )}
          <span
            aria-hidden
            className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rotate-45 border-b border-r border-slate-400 transition-transform group-open:-translate-y-0.5 group-open:rotate-[225deg]"
          />
        </span>
      </summary>
      <div className="grid sm:grid-cols-[7rem_1fr] sm:gap-6">
        <span className="hidden sm:block" aria-hidden />
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </details>
  );
}
