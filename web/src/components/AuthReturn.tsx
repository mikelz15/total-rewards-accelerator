"use client";

import { useEffect } from "react";
import { authReturnTarget } from "@/lib/auth-link";

/** Catches a reset or confirm link that opened the public site instead of the form. */
export function AuthReturn() {
  useEffect(() => {
    const dest = authReturnTarget(
      window.location.pathname,
      window.location.hash,
      window.location.search
    );
    if (dest) window.location.replace(dest);
  }, []);
  return null;
}
