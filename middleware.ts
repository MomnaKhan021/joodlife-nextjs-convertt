import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate middleware.
 *
 * - `/profile/*` requires the Payload auth cookie. Anonymous users
 *   are bounced to `/login?next=<path>`.
 * - `/login` and `/signup` flip the other way: if the user is
 *   already signed in (cookie present), they go straight to
 *   `/profile`.
 * - `/account` is kept as a friendly alias that resolves to either
 *   `/profile` (signed in) or `/login` (signed out).
 *
 * Only checks cookie *presence*. Real validation happens server-side
 * in the page itself via `getCurrentUser()` so a tampered cookie
 * doesn't actually grant access.
 */

const TOKEN_COOKIE = "payload-token";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const url = req.nextUrl;
  const path = url.pathname;

  // Friendly alias
  if (path === "/account") {
    return NextResponse.redirect(
      new URL(token ? "/profile" : "/login", req.url)
    );
  }

  // Don't show login/signup to already-authenticated users
  if ((path === "/login" || path === "/signup") && token) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // Protect /profile/* — bounce to /login with a `next` param
  if (path.startsWith("/profile") && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Protect /admin-tools/* — bounce to /login carrying the FULL requested
  // path (incl. query) so after signing in the admin lands back on the exact
  // page they asked for instead of a generic dashboard.
  // `/cms` uses the same treatment as `/admin-tools`: the CMS layout reads
  // x-admin-pathname to run its per-section staff guard.
  if (path.startsWith("/admin-tools") || path.startsWith("/cms")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", path + (url.search || ""));
      return NextResponse.redirect(loginUrl);
    }
    // Layouts can't read the pathname from props, so forward it (+ query)
    // as request headers. The admin layout uses these to enforce the
    // per-section staff permission guard server-side.
    const headers = new Headers(req.headers);
    headers.set("x-admin-pathname", path);
    headers.set("x-admin-search", url.search || "");
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account",
    "/login",
    "/signup",
    "/profile/:path*",
    "/admin-tools",
    "/admin-tools/:path*",
    "/cms",
    "/cms/:path*",
  ],
};
