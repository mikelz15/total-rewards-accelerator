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
  const safe = safeNext(next);
  if (safe) return safe;
  if (type === "recovery") return "/auth/reset-password";
  return "/auth/confirm";
}
