import { NextResponse, type NextRequest } from "next/server";

import { signState } from "@/lib/authPasswordless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function baseUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL || req.nextUrl.origin).replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const base = baseUrl(req);
  const next = req.nextUrl.searchParams.get("next") || "/profile";

  if (!clientId) {
    return NextResponse.redirect(`${base}/login?error=google_unavailable`);
  }

  const state = signState({ next, t: Date.now(), r: Math.random().toString(36).slice(2) });
  const redirectUri = `${base}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("jl_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
