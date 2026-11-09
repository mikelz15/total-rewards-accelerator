"use client";

import { useState } from "react";

/**
 * Store product image with a quiet fallback.
 *
 * The store page is a Server Component, so it cannot pass onError to <img>
 * (Next fails the static build with "Event handlers cannot be passed to Client
 * Component props"). This wrapper owns the handler, and on a missing file it
 * shows a neutral tile once instead of swapping src (which can loop when the
 * placeholder is missing too).
 */
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4 text-center text-sm font-medium text-teal-900">
        {alt}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
  );
}
