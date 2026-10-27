/**
 * POST /api/portal/magic { email } — "Email me a login link".
 *
 * Always answers the same way, so it can't be used to find out whether an
 * email has an account. For a patient account it stores the SHA-256 of a
 * random token (15 minutes, single use; a new link cancels older ones; at most
 * one email a minute) and emails a link to /new_profile/login?link=…, where
 * the patient presses "Finish logging in" (POST /api/portal/magic/verify).
 * Staff accounts never get links: they log in with a password and admin 2FA.
 */
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { sendPortalLoginLinkEmail } from "@/lib/account-email";
import { isSameOrigin, fail, readJson } from "@/lib/portal/api";
import { ensurePortalTables, getDb, lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SAME_REPLY = { ok: true, message: "If there's a Jood account for that email, we've sent a login link. It works once and expires in 15 minutes." };

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail("Cross-origin request rejected", 403);
  const b = await readJson(req);
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter the email address you used with Jood");

  const db = await getDb();
  await ensurePortalTables(db);
  const user = (await db.query(`SELECT id, name, role, lock_until FROM "users" WHERE lower(email) = ${lit(email)} LIMIT 1`).catch(() => []))[0];
  const role = String(user?.role ?? "");
  if (!user || role === "admin" || role === "staff") return NextResponse.json(SAME_REPLY);
  if (user.lock_until && new Date(user.lock_until as string).getTime() > Date.now()) return NextResponse.json(SAME_REPLY);

  const uid = Number(user.id);
  const recent = await db.query(
    `SELECT 1 FROM "portal_login_links" WHERE user_id = ${lit(uid)} AND created_at > now() - interval '1 minute' LIMIT 1`,
  );
  if (recent.length) return NextResponse.json(SAME_REPLY);

  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await db.query(`UPDATE "portal_login_links" SET used_at = now() WHERE user_id = ${lit(uid)} AND used_at IS NULL`);
  await db.query(`DELETE FROM "portal_login_links" WHERE created_at < now() - interval '2 days'`);
  await db.query(`
    INSERT INTO "portal_login_links" (user_id, token_hash, next, expires_at)
    VALUES (${lit(uid)}, ${lit(hash)}, '/new_profile', now() + interval '15 minutes')
  `);

  const url = `${req.nextUrl.origin}/new_profile/login?link=${encodeURIComponent(token)}`;
  const payload = await getPayloadInstance();
  await sendPortalLoginLinkEmail(payload, { email, url, name: (user.name as string) ?? null });
  return NextResponse.json(SAME_REPLY);
}
