import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "tra_demo_auth";

/**
 * Optional demo password gate.
 * Set DEMO_PASSWORD in the web env (and same value for API if used).
 * Leave unset for open local development.
 *
 * Public assets (/brand, icons, Next static) must stay open so the login
 * page can load the logo without a cookie.
 */
export function middleware(request: NextRequest) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/favicon") ||
    pathname === "/icon.png" ||
    pathname === "/icon" ||
    pathname.startsWith("/api/demo-auth")
  ) {
    return NextResponse.next();
  }

  const unlocked = request.cookies.get(COOKIE)?.value;
  if (unlocked === "1") {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Run on app routes, skip Next internals and static files in /public.
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
