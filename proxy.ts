import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Global auth proxy (Next.js 16).
 *
 * - Public routes (/login) are allow-listed.
 * - All other matched routes require a valid Supabase session.
 * - Authenticated users accessing /login are redirected to /dashboard.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If env vars are missing, let the request through — the page-level
    // client will throw a clearer error.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ── Authenticated user on /login → redirect out ──── */
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  /* ── Public route → allow ──────────────────────────── */
  if (pathname === "/login") {
    return response;
  }

  /* ── No session → redirect to /login ───────────────── */
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/tickets/:path*",
    "/reports/:path*",
    "/dashboard/:path*",
    "/faq/:path*",
    "/config/:path*",
    "/api/:path*",
  ],
};
