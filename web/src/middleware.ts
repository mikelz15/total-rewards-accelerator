import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "tra_demo_auth";

/**
 * Optional demo password gate.
 * Set DEMO_PASSWORD in the web env (and same value for API if used).
 * Leave unset for open local development.
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
    pathname.startsWith("/favicon") ||
    pathname === "/api/demo-auth"
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
