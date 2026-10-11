/** Where an email link should land. Only same-site paths are allowed. */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "";
  }
  return raw;
}

/**
 * Implicit recovery links put the session in the URL hash. A server redirect
 * drops that hash, so the browser has to carry it to a client page.
 */
export function hashDestination(next: string | null, type: string | null): string {
  if (type === "recovery") return "/auth/reset-password";
  const safe = safeNext(next);
  if (safe) return safe;
  return "/auth/confirm";
}

/**
 * An email link sometimes lands on the public homepage, hash and all.
 * Send it to the page that can read the session. Stay put on the auth pages.
 */
export function authReturnTarget(path: string, hash: string, search: string): string | null {
  if (
    path.startsWith("/auth/reset-password") ||
    path.startsWith("/auth/confirm") ||
    path.startsWith("/auth/callback")
  ) {
    return null;
  }

  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(search.replace(/^\?/, ""));
  const type = hashParams.get("type") || searchParams.get("type");

  if (hashParams.get("access_token") && hashParams.get("refresh_token")) {
    const dest = type === "recovery" ? "/auth/reset-password" : "/auth/confirm";
    const fragment = hash.startsWith("#") ? hash : `#${hash}`;
    return dest + fragment;
  }

  const error =
    hashParams.get("error_description") || hashParams.get("error_code") || hashParams.get("error");
  if (error) {
    return `/login?error=confirm&detail=${encodeURIComponent(error)}`;
  }

  const code = searchParams.get("code");
  if (code && /^[0-9a-f-]{36}$/i.test(code)) {
    const next = type === "recovery" ? "/auth/reset-password" : "/app";
    return `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
  }

  return null;
}
