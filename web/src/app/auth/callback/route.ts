import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Handles Supabase email-confirm / magic-link redirects (?code=...).
 * Configure in Supabase → Authentication → URL Configuration:
 *   Site URL: http://localhost:3000
 *   Redirect URLs: http://localhost:3000/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") || "/app";
  const next = nextRaw.startsWith("/") ? nextRaw : "/app";

  if (code) {
    const cookieStore = cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.redirect(`${origin}/login?error=config`);
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=confirm&detail=${encodeURIComponent(error.message)}`
    );
  }

  // Hash-based tokens (older templates) land here without ?code=
  return NextResponse.redirect(`${origin}/auth/confirm`);
}
