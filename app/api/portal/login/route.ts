/**
 * POST /api/portal/login — email + password, then an emailed 6-digit code.
 *
 *   { email, password }        → password checked; a code is emailed
 *                                 → { ok, step: "code", to: "s•••@example.com" }
 *   { email, password, code }  → password and code checked; the Payload
 *                                 session cookie is set → { ok, step: "done" }
 *
 * Staff accounts skip the emailed code here because admin-tools has its own
 * two-factor gate, and patients who switch two-step verification off in the
 * portal skip it too. Codes reuse users.email_otp_hash / email_otp_expires
 * (the staff 2FA columns) and allow 5 wrong tries before a new code is needed.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { generateEmailOtp, hashOtp, verifyOtpHash } from "@/lib/totp";
import { sendPortalLoginCodeEmail } from "@/lib/account-email";
import { isSameOrigin, fail, readJson } from "@/lib/portal/api";
import { asObject, ensurePortalTables, getDb, lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CODE_MINUTES = 10;
const MAX_TRIES = 5;

function mask(email: string): string {
  const [u, d] = email.split("@");
  return `${u.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}`;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail("Cross-origin request rejected", 403);
  const b = await readJson(req);
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const code = String(b.code ?? "").replace(/\D/g, "");
  // "Keep me logged in": off = the cookie ends when the browser closes.
  const remember = b.remember !== false;
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter the email address you used with Jood");
  if (password.length < 6) return fail("Your password is at least 6 characters");

  const payload = await getPayloadInstance();
  let result: { token?: string; exp?: number; user?: Record<string, unknown> };
  try {
    result = (await payload.login({ collection: "users", data: { email, password } })) as typeof result;
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    if (/locked/i.test(msg)) return fail("Too many attempts. Please wait a few minutes or reset your password.", 429);
    return fail("That email and password don't match", 401);
  }
  const user = result.user ?? {};
  const uid = Number(user.id);
  if (!result.token || !Number.isFinite(uid)) return fail("We couldn't log you in. Please try again.", 500);

  const db = await getDb();
  await ensurePortalTables(db);
  const role = String(user.role ?? "customer");
  const prefs = await db.query(`SELECT data FROM "portal_prefs" WHERE user_id = ${lit(uid)} LIMIT 1`).catch(() => []);
  const wantsCode = role !== "admin" && role !== "staff" && asObject(prefs[0]?.data).twoFA !== false;

  if (wantsCode && !code) {
    const row = (await db.query(`SELECT email_otp_expires FROM "users" WHERE id = ${lit(uid)} LIMIT 1`))[0] ?? {};
    const expires = row.email_otp_expires ? new Date(row.email_otp_expires as string).getTime() : 0;
    // Don't send a fresh code more than once a minute.
    const sentRecently = expires - Date.now() > (CODE_MINUTES - 1) * 60 * 1000;
    if (!sentRecently) {
      const otp = generateEmailOtp();
      await db.query(`
        UPDATE "users" SET email_otp_hash = ${lit(hashOtp(otp))},
          email_otp_expires = now() + interval '${CODE_MINUTES} minutes', email_otp_attempts = 0
        WHERE id = ${lit(uid)}
      `);
      await sendPortalLoginCodeEmail(payload, { email, code: otp, name: (user.name as string) ?? null });
    }
    return NextResponse.json({ ok: true, step: "code", to: mask(email), sent: !sentRecently });
  }

  if (wantsCode) {
    const row = (await db.query(
      `SELECT email_otp_hash, email_otp_expires, COALESCE(email_otp_attempts, 0) AS tries FROM "users" WHERE id = ${lit(uid)} LIMIT 1`,
    ))[0] ?? {};
    const expired = !row.email_otp_expires || new Date(row.email_otp_expires as string).getTime() < Date.now();
    if (!row.email_otp_hash || expired) return fail("That code has expired. Tap “Resend code” for a new one.", 401);
    if (Number(row.tries) >= MAX_TRIES) return fail("Too many wrong codes. Tap “Resend code” for a new one.", 429);
    if (!verifyOtpHash(code, row.email_otp_hash as string)) {
      await db.query(`UPDATE "users" SET email_otp_attempts = COALESCE(email_otp_attempts, 0) + 1 WHERE id = ${lit(uid)}`);
      return fail("That code doesn't match. Check the latest email from us.", 401);
    }
    await db.query(`UPDATE "users" SET email_otp_hash = NULL, email_otp_expires = NULL, email_otp_attempts = 0 WHERE id = ${lit(uid)}`);
  }

  const res = NextResponse.json({ ok: true, step: "done" });
  res.cookies.set("payload-token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: remember && result.exp ? new Date(result.exp * 1000) : undefined,
  });
  return res;
}
