/**
 * PUT /api/portal/state — saves the patient's own portal logs and settings
 * (doses, ED and period-delay logs, reminders, goal, measurements, contact
 * preferences, read notifications) into portal_prefs. Whitelisted keys only,
 * capped in size. Orders, weigh-ins, check-ins and messages have their own
 * routes and are never written here.
 */
import { NextResponse, type NextRequest } from "next/server";

import { portalRequest, fail, readJson } from "@/lib/portal/api";
import { jsonLit, lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEYS = [
  "svc", "unit", "discreet", "twoFA", "safePlace", "gpShare", "gp", "goal", "waist", "hips", "start",
  "wl", "ed", "pd", "reminders", "channels", "fired", "ms5", "ms10", "ms15", "heightCm",
  "activity", "localNotifs", "readNotifs",
];
const MAX_BYTES = 256 * 1024;

export async function PUT(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(req);
  const data: Record<string, unknown> = {};
  for (const k of KEYS) if (k in body) data[k] = body[k];
  // "fired" grows by one key per reminder alert; keep the last fortnight's worth.
  if (data.fired && typeof data.fired === "object") {
    const entries = Object.entries(data.fired as Record<string, unknown>).slice(-500);
    data.fired = Object.fromEntries(entries);
  }
  const json = JSON.stringify(data);
  if (json.length > MAX_BYTES) return fail("Too much data to save", 413);
  await ctx.db.query(`
    INSERT INTO "portal_prefs" (user_id, email, data, updated_at)
    VALUES (${lit(ctx.uid)}, ${lit(ctx.user.email.toLowerCase())}, ${jsonLit(data)}, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, email = EXCLUDED.email, updated_at = now()
  `);
  return NextResponse.json({ ok: true });
}
