/** POST /api/portal/logout — ends the session by clearing the Payload cookie. */
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin, fail } from "@/lib/portal/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail("Cross-origin request rejected", 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("payload-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
