/**
 * POST /api/portal/logout — ends the session: the Payload session row is
 * deleted (so a copy of the cookie stops working too) and the cookie cleared.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin, fail, portalRequest } from "@/lib/portal/api";
import { lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail("Cross-origin request rejected", 403);
  // Best effort: the cookie is cleared below whatever happens here.
  try {
    const token = req.cookies.get("payload-token")?.value;
    // portalRequest verifies the token, so its session id can be trusted.
    const ctx = token ? await portalRequest(req) : null;
    if (token && ctx && !(ctx instanceof NextResponse)) {
      const sid = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString()).sid;
      if (sid) {
        await ctx.db.query(`DELETE FROM "users_sessions" WHERE id = ${lit(String(sid))} AND _parent_id = ${lit(ctx.uid)}`);
      }
    }
  } catch {
    /* the session simply expires on its own */
  }
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
