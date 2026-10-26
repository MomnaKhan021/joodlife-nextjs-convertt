/**
 * POST /api/portal/messages — a patient's message to the clinical team.
 * Body: { svc: "wl"|"ed"|"pd", body }
 * Staff read and reply in admin-tools → Patient messages.
 */
import { NextResponse, type NextRequest } from "next/server";

import { portalRequest, fail, readJson, svcOf } from "@/lib/portal/api";
import { lit } from "@/lib/portal/db";
import { ukStamp } from "@/lib/portal/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const b = await readJson(req);
  const text = String(b.body ?? "").trim();
  if (!text) return fail("Write a message first");
  if (text.length > 4000) return fail("Please keep messages under 4,000 characters");
  const svc = svcOf(b.svc);

  // Light flood guard: at most 20 messages in 10 minutes.
  const recent = await ctx.db.query(
    `SELECT count(*)::int AS n FROM "portal_messages" WHERE user_id = ${lit(ctx.uid)} AND from_staff = false AND created_at > now() - interval '10 minutes'`,
  );
  if (Number(recent[0]?.n ?? 0) >= 20) return fail("You've sent a lot of messages. Please wait a few minutes, or WhatsApp us.", 429);

  const rows = await ctx.db.query(`
    INSERT INTO "portal_messages" (user_id, email, svc, from_staff, author, body)
    VALUES (${lit(ctx.uid)}, ${lit(ctx.user.email.toLowerCase())}, ${lit(svc)}, false, ${lit(ctx.user.name ?? ctx.user.email)}, ${lit(text)})
    RETURNING id, created_at
  `);
  return NextResponse.json({
    ok: true,
    message: { id: Number(rows[0].id), me: true, from: "You", at: ukStamp(rows[0].created_at), text, read: true },
  });
}
