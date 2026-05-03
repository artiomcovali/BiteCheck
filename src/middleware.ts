/**
 * Next.js middleware: Supabase session refresh + protected-route gate.
 *
 * On every request:
 *  1. Refresh the Supabase auth cookie (access tokens expire in ~1h).
 *  2. If the user is unauthenticated and the route is protected, redirect to
 *     `/login?next=<path>` so they return to where they were after sign-in.
 *  3. If the user is authenticated and on a public auth page, send them home.
 *
 * Protected paths (require auth):
 *  - `/`            (chat)
 *  - `/onboarding`
 *  - `/dashboard`
 *  - `/menu`
 *
 * Public paths:
 *  - `/login`, `/signup`
 *  - `/api/*`     (route handlers do their own auth where needed)
 *  - static assets (excluded by the matcher below)
 *
 * If Supabase env vars are unset (e.g., a fresh clone before the developer
 * adds `.env.local`), middleware is a no-op — the demo continues to run.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/onboarding", "/dashboard", "/agent", "/menu", "/profile"];
const PROTECTED_EXACT = new Set(["/"]);
const PUBLIC_AUTH_PATHS = new Set(["/login", "/signup"]);

function isProtected(pathname: string): boolean {
  if (PROTECTED_EXACT.has(pathname)) return true;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

async function getHasProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<boolean | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Step 2 lands before the Step 3 migration creates `profiles`.
    // Keep auth working until the table exists, then middleware tightens
    // automatically without another code change.
    return null;
  }

  return Boolean(data);
}

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Auth not yet configured — let everything through.
    return NextResponse.next({ request: req });
  }

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          req.cookies.set(name, value);
        }
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  if (!user && isProtected(pathname)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const hasProfile = await getHasProfile(supabase, user.id);

    if (hasProfile === false && pathname !== "/onboarding") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (hasProfile === true && pathname === "/onboarding") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (PUBLIC_AUTH_PATHS.has(pathname)) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = hasProfile === false ? "/onboarding" : "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  // Match every request except static assets and image optimization output.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
