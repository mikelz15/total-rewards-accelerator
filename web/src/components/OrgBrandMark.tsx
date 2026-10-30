"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

/** The org's uploaded image in the app header, or the TRA mark when there is none or it fails. */
export function OrgBrandMark({ src, orgName }: { src?: string | null; orgName?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <BrandLogo variant="nav" href="/app" priority />;
  }

  return (
    <Link
      href="/app"
      className="inline-flex shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
    >
      {/* Remote Storage URL; next/image would need a remotePatterns entry per project. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={orgName ? `${orgName} logo` : "Organization logo"}
        className="h-10 w-auto max-w-[180px] object-contain object-left sm:h-11"
        onError={() => setFailedSrc(src)}
      />
    </Link>
  );
}
