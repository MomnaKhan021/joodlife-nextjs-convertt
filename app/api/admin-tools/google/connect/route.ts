/**
 * GET /api/admin-tools/google/connect — admin only. Starts the one-time Google
 * sign-in (the clinic's hello@joodlife.com account) that lets Clinical Check
 * read Gemini meeting notes. See lib/googleMeetNotes.ts.
 */
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { authUrl, googleConfigured } from "@/lib/googleMeetNotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  if (!googleConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Google isn't set up yet: add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel first." },
      { status: 503 },
    );
  }
  const state = crypto.randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authUrl(req.nextUrl.origin, state));
  res.cookies.set("jl_google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin-tools/google",
    maxAge: 600,
  });
  return res;
}
