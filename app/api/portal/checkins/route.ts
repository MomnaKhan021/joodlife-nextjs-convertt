/**
 * POST /api/portal/checkins — the weekly weight-loss check-in.
 * Body: { mood, effects: string[], severe: boolean, note? }
 * Stored in portal_checkins for the prescriber (admin-tools → Patient
 * messages). A note is also added to the patient's message thread so the
 * prescriber can reply to it there.
 */
import { NextResponse, type NextRequest } from "next/server";

import { portalRequest, fail, readJson } from "@/lib/portal/api";
import { jsonLit, lit } from "@/lib/portal/db";
import { ukStamp } from "@/lib/portal/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MOODS = ["Great", "Good", "Okay", "Not great", "Poor"];

export async function POST(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const b = await readJson(req);
  const mood = MOODS.includes(String(b.mood)) ? String(b.mood) : null;
  if (!mood) return fail("Tell us how you're feeling");
  const effects = (Array.isArray(b.effects) ? b.effects : []).map((x) => String(x).slice(0, 60)).slice(0, 12);
  const severe = b.severe === true;
  const note = String(b.note ?? "").trim().slice(0, 2000);
  const email = ctx.user.email.toLowerCase();

  const rows = await ctx.db.query(`
    INSERT INTO "portal_checkins" (user_id, email, svc, mood, effects, severe, note)
    VALUES (${lit(ctx.uid)}, ${lit(email)}, 'wl', ${lit(mood)}, ${jsonLit(effects)}, ${lit(severe)}, ${lit(note || null)})
    RETURNING id, created_at
  `);
  let message = null;
  if (note) {
    const m = await ctx.db.query(`
      INSERT INTO "portal_messages" (user_id, email, svc, from_staff, author, body)
      VALUES (${lit(ctx.uid)}, ${lit(email)}, 'wl', false, ${lit(ctx.user.name ?? email)}, ${lit(`Weekly check-in: ${note}`)})
      RETURNING id, created_at
    `);
    message = { id: Number(m[0].id), me: true, from: "You", at: ukStamp(m[0].created_at), text: `Weekly check-in: ${note}`, read: true };
  }
  return NextResponse.json({
    ok: true,
    checkin: { at: ukStamp(rows[0].created_at), mood, effects, note, severe, reply: "" },
    message,
  });
}
