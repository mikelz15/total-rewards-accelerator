import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth-link";

/**
 * Email links land here.
 * PKCE arrives as ?code= and the session cookie has to ride on the redirect.
 * Implicit recovery arrives as #access_token. A 302 drops that hash, so this
 * route returns a page that carries the hash to the reset form.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next")) || "/app";

  if (code) {
    const cookieStore = cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.redirect(`${origin}/login?error=config`);
    }

    const redirect = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            redirect.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect;
    }
    return NextResponse.redirect(
      `${origin}/login?error=confirm&detail=${encodeURIComponent(error.message)}`
    );
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>TRA</title></head>
<body>
<p>Opening your link…</p>
<script>
  var hash = window.location.hash || "";
  var hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  var next = new URLSearchParams(window.location.search).get("next") || "";
  if (next.charAt(0) !== "/" || next.indexOf("//") === 0 || next.indexOf("\\\\") !== -1) next = "";
  var type = hashParams.get("type") || "";
  var dest = type === "recovery" ? "/auth/reset-password" : (next || "/auth/confirm");
  if (hashParams.get("access_token") && hashParams.get("refresh_token")) {
    window.location.replace(dest + hash);
  } else {
    var detail = hashParams.get("error_description") || hashParams.get("error_code") || hashParams.get("error") || "";
    var login = "/login?error=confirm";
    if (detail) login += "&detail=" + encodeURIComponent(detail);
    window.location.replace(login);
  }
</script>
</body>
</html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
