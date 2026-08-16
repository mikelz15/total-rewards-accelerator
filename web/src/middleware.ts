import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const DEMO_COOKIE = "tra_demo_auth";

/**
 * Dual gate:
 * 1) /app/* → Supabase session when configured (SaaS)
 * 2) Optional DEMO_PASSWORD for public demo routes (legacy pilot gate)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, configured } = await updateSession(request);

  // SaaS app shell
  if (pathname.startsWith("/app")) {
    if (!configured) {
      const url = request.nextUrl.clone();
      url.pathname = "/signup";
      url.searchParams.set("setup", "1");
      return NextResponse.redirect(url);
    }
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Optional shared demo password (does not apply to auth pages or SaaS)
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    return response;
  }

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/favicon") ||
    pathname === "/icon.png" ||
    pathname === "/icon" ||
    pathname.startsWith("/api/demo-auth") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/pricing")
  ) {
    return response;
  }

  const unlocked = request.cookies.get(DEMO_COOKIE)?.value;
  if (unlocked === "1") {
    return response;
  }

  // If user has Supabase session, allow through even when DEMO_PASSWORD set
  if (user) {
    return response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
