/**
 * /api/portal/weights — the patient's weigh-ins, stored in the existing
 * weight-logs collection (so HubSpot sync and the admin views keep working).
 *   POST { date: "YYYY-MM-DD", weightKg } → one entry per day: updates that
 *        day's entry if there is one, otherwise creates it.
 *   DELETE ?id= → removes one of the patient's own entries.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { ensureWeightLogsTable } from "@/lib/weightLogs";
import { portalRequest, fail, readJson } from "@/lib/portal/api";
import { lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(req);
  const kg = Math.round(Number(body.weightKg) * 10) / 10;
  if (!Number.isFinite(kg) || kg < 30 || kg > 300) return fail("Enter your weight in kg, for example 86.4");
  const date = String(body.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Pick a date");
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) return fail("Pick today or an earlier date");
  // Today's entry keeps the real time; a past date is stored at midday UK.
  const loggedAt = date === today ? new Date().toISOString() : new Date(`${date}T12:00:00Z`).toISOString();

  const email = ctx.user.email.toLowerCase();
  await ensureWeightLogsTable();
  const payload = await getPayloadInstance();
  const existing = await ctx.db.query(`
    SELECT id FROM "weight_logs"
    WHERE lower(customer_email) = ${lit(email)}
      AND (logged_at AT TIME ZONE 'Europe/London')::date = ${lit(date)}::date
    ORDER BY logged_at DESC LIMIT 1
  `);
  if (existing[0]?.id) {
    const id = Number(existing[0].id);
    await payload.update({ collection: "weight-logs", id, data: { weightKg: kg }, overrideAccess: true });
    return NextResponse.json({ ok: true, id });
  }
  const doc = await payload.create({
    collection: "weight-logs",
    data: { user: ctx.uid, customerEmail: email, weightKg: kg, loggedAt },
    overrideAccess: true,
  });
  return NextResponse.json({ ok: true, id: Number(doc.id) });
}

export async function DELETE(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id)) return fail("Missing entry");
  const own = await ctx.db.query(
    `SELECT id FROM "weight_logs" WHERE id = ${lit(id)} AND lower(customer_email) = ${lit(ctx.user.email.toLowerCase())} LIMIT 1`,
  );
  if (!own[0]) return fail("Entry not found", 404);
  const payload = await getPayloadInstance();
  await payload.delete({ collection: "weight-logs", id, overrideAccess: true });
  return NextResponse.json({ ok: true });
}
