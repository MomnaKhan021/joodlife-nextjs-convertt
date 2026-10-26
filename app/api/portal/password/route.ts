/**
 * POST /api/portal/password { current, next } — change password from the
 * portal. The current password is checked first; the new one needs 8+
 * characters including a number.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { portalRequest, fail, readJson } from "@/lib/portal/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const b = await readJson(req);
  const current = String(b.current ?? "");
  const next = String(b.next ?? "");
  if (!current) return fail("Enter your current password");
  if (next.length < 8 || !/\d/.test(next)) return fail("Use at least 8 characters including a number");
  if (next === current) return fail("Choose a password you haven't used here before");

  const payload = await getPayloadInstance();
  try {
    await payload.login({ collection: "users", data: { email: ctx.user.email, password: current } });
  } catch {
    return fail("Your current password isn't right", 401);
  }
  await payload.update({ collection: "users", id: ctx.uid, data: { password: next }, overrideAccess: true });
  return NextResponse.json({ ok: true });
}
