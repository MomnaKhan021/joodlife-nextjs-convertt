import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE,
  TOKEN_MAX_AGE,
  issueSessionForEmail,
  readState,
} from "@/lib/authPasswordless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function baseUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL || req.nextUrl.origin).replace(/\/$/, "");
}

/** Decode a JWT payload without verifying (the id_token came straight from
 *  Google's token endpoint over TLS, authenticated by our client secret). */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const part = jwt.split(".")[1];
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const base = baseUrl(req);
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const stateParam = params.get("state");
  const cookieState = req.cookies.get("jl_oauth_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(`${base}/login?error=${encodeURIComponent(reason)}`);

  if (params.get("error")) return fail("google_declined");
  if (!code || !stateParam || !cookieState || stateParam !== cookieState) {
    return fail("google_state");
  }
  const state = readState<{ next?: string }>(stateParam);
  if (!state) return fail("google_state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google_unavailable");

  // Exchange the code for tokens.
  let email = "";
  let name: string | null = null;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${base}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("google_token");
    const tokens = (await tokenRes.json()) as { id_token?: string; access_token?: string };
    const claims = tokens.id_token ? decodeJwtPayload(tokens.id_token) : null;
    email = String(claims?.email ?? "").toLowerCase();
    name = (claims?.name as string) || null;
    if (!email && tokens.access_token) {
      const ui = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (ui.ok) {
        const u = (await ui.json()) as { email?: string; name?: string };
        email = String(u.email ?? "").toLowerCase();
        name = name || u.name || null;
      }
    }
  } catch {
    return fail("google_token");
  }

  if (!email) return fail("google_no_email");

  const session = await issueSessionForEmail(email, name);
  if (!session) return fail("google_session");

  const dest = state.next && state.next.startsWith("/") ? state.next : "/profile";
  const res = NextResponse.redirect(`${base}${dest}`);
  res.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
  res.cookies.set("jl_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
