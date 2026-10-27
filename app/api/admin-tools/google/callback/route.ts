/**
 * GET /api/admin-tools/google/callback — Google sends the admin back here after
 * sign-in. Checks the state cookie, swaps the code for a refresh token, stores
 * it encrypted and returns to Clinical Check.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { exchangeCode, saveGoogleConnection } from "@/lib/googleMeetNotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const back = (msg: string) =>
    NextResponse.redirect(`${req.nextUrl.origin}/admin-tools/clinical-queue?google=${encodeURIComponent(msg)}`);
  const user = await getCurrentUser();
  if (user?.role !== "admin") return back("admin-only");

  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get("jl_google_state")?.value;
  if (!state || !saved || state !== saved) return back("expired");
  if (req.nextUrl.searchParams.get("error")) return back("cancelled");
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return back("failed");

  try {
    const t = await exchangeCode(req.nextUrl.origin, code);
    await saveGoogleConnection({
      refreshToken: t.refreshToken,
      email: t.email,
      connectedBy: user.email,
      connectedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[google] connect failed:", (err as Error).message);
    return back("failed");
  }
  const res = back("connected");
  res.cookies.delete({ name: "jl_google_state", path: "/api/admin-tools/google" });
  return res;
}
