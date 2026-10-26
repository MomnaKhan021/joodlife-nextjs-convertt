/**
 * POST /api/portal/profile — the portal's "Your details" and "Delivery
 * address" saves. Same rules as /api/profile/update (UK phone, unique email,
 * default address on the account, never touching placed orders), but with the
 * portal's session check so it works on every host the site is served from.
 * Body: { name, email, phone, address }
 */
import { NextResponse, type NextRequest } from "next/server";

import { isValidEmail, isValidFullName, NAME_MAX, ADDRESS_MAX } from "@/lib/formValidation";
import { portalRequest, fail, readJson } from "@/lib/portal/api";
import { lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** UK phone to national 0… form, or null (same as /api/profile/update). */
function normaliseUkPhone(raw: string): string | null {
  let n = (raw || "").replace(/[\s().-]/g, "");
  if (n.startsWith("+44")) n = "0" + n.slice(3);
  else if (n.startsWith("0044")) n = "0" + n.slice(4);
  else if (n.startsWith("44") && n.length >= 12) n = "0" + n.slice(2);
  return /^0(?:1\d{8,9}|2\d{9}|3\d{9}|7\d{9})$/.test(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const ctx = await portalRequest(req);
  if (ctx instanceof NextResponse) return ctx;
  const b = await readJson(req);
  const name = String(b.name ?? "").trim().slice(0, NAME_MAX);
  const email = String(b.email ?? "").trim().toLowerCase();
  const phoneRaw = String(b.phone ?? "").trim();
  const address = String(b.address ?? "").trim().slice(0, ADDRESS_MAX);

  if (name && !isValidFullName(name)) return fail("Please enter a valid name.", 422);
  if (!email || !isValidEmail(email)) return fail("Please enter a valid email address.", 422);
  let phone = "";
  if (phoneRaw) {
    const p = normaliseUkPhone(phoneRaw);
    if (!p) return fail("Please enter a valid UK mobile number.", 422);
    phone = p;
  }

  if (email !== ctx.user.email.toLowerCase()) {
    const taken = await ctx.db
      .query(`SELECT id FROM "users" WHERE LOWER(email) = ${lit(email)} AND id <> ${lit(ctx.uid)} LIMIT 1`)
      .catch(() => []);
    if (taken.length) return fail("That email is already in use.", 409);
  }

  try {
    await ctx.db.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS default_address text`);
    await ctx.db.query(`
      UPDATE "users"
         SET name = ${name ? lit(name) : "name"},
             phone = ${phone ? lit(phone) : "NULL"},
             email = ${lit(email)},
             default_address = ${address ? lit(address) : "NULL"},
             updated_at = now()
       WHERE id = ${lit(ctx.uid)}
    `);
  } catch (err) {
    if (/unique|duplicate/i.test(String(err))) return fail("That email is already in use.", 409);
    return fail("Could not save changes.", 500);
  }
  return NextResponse.json({ ok: true, name, email, phone, address });
}
