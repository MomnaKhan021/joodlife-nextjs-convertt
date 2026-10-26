/** POST /api/portal/messages/read { svc } — marks the clinical team's replies in that thread as read. */
import { NextResponse, type NextRequest } from "next/server";

import { portalRequest, readJson, svcOf } from "@/lib/portal/api";
import { lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const b = await readJson(req);
  await ctx.db.query(`
    UPDATE "portal_messages" SET read_by_patient_at = now()
    WHERE user_id = ${lit(ctx.uid)} AND svc = ${lit(svcOf(b.svc))} AND from_staff = true AND read_by_patient_at IS NULL
  `);
  return NextResponse.json({ ok: true });
}
