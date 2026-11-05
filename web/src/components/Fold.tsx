"use client";

import Link from "next/link";

/**
 * A title that stays on the page. The sentence opens on click.
 * The link is the name. The rest of the row is the disclosure.
 * Closed, it is one line. The number sits beside the name, not above it.
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
    <details className="group border-b border-slate-200/80 py-5 open:pb-6">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 rounded-sm marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-baseline gap-4">
          <span className="w-8 shrink-0 tabular-nums text-base text-slate-400">{kicker}</span>
          {href ? (
            <Link
              href={href}
              className="text-xl font-medium tracking-tight text-slate-900 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {title}
            </Link>
          ) : (
            <span className="text-xl font-medium tracking-tight text-slate-900">{title}</span>
          )}
        </span>
        <span
          aria-hidden
          className="inline-block h-2 w-2 shrink-0 translate-y-[-2px] rotate-45 border-b border-r border-slate-400 transition-transform group-open:translate-y-0.5 group-open:rotate-[225deg]"
        />
      </summary>
      <div className="max-w-2xl pl-12 pt-3 text-base leading-relaxed text-slate-600">{children}</div>
    </details>
  );
}
