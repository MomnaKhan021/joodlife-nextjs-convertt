/**
 * Admin two-factor auth — GET status, POST { action } to manage.
 *
 *   GET                      -> { ok, enabled, pending }
 *   POST { action:"setup" }  -> { ok, secret, otpauth }   (creates a pending secret)
 *   POST { action:"enable", token }  -> verifies + turns 2FA on, sets session cookie
 *   POST { action:"verify", token }  -> verifies for this login, sets session cookie
 *   POST { action:"disable", token } -> verifies + turns 2FA off, clears secret
 *
 * Admin/staff only. TOTP is dependency-free (see lib/totp).
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { sendTwoFactorCodeEmail } from "@/lib/account-email";
import {
  generateSecret,
  otpauthUri,
  verifyTotp,
  generateEmailOtp,
  hashOtp,
  verifyOtpHash,
  signTwoFactorCookie,
  TWOFA_COOKIE,
} from "@/lib/totp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

function rows<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}
const escStr = (s: string) => "'" + s.replace(/'/g, "''") + "'";

type Denied = { deniedEmail: string; deniedRole: string };

type Ctx = {
  payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  id: string;
  email: string;
  name: string | null;
  drizzle: DrizzleLike;
  sql: SqlRaw;
};

async function ctx(): Promise<Ctx | Denied | null> {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) return null;
  let role = (user as unknown as { role?: string }).role;
  const email = String((user as unknown as { email?: string }).email ?? "");
  // Allowlisted emails are always admins — heal a missed promotion here so
  // the gate never locks out an allowlisted account.
  if (role !== "admin") {
    const { promoteIfAllowlisted } = await import("@/lib/adminAllowlist");
    const id = (user as unknown as { id: string | number }).id;
    if (await promoteIfAllowlisted(payload, { id, email, role })) role = "admin";
  }
  if (role !== "admin" && role !== "staff") {
    return { deniedEmail: email, deniedRole: role ?? "unknown" } satisfies Denied;
  }
  const drizzle = (payload.db as unknown as { drizzle?: DrizzleLike }).drizzle as DrizzleLike;
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return {
    payload,
    id: String((user as unknown as { id: string | number }).id),
    email: email || "admin",
    name: (user as unknown as { name?: string }).name ?? null,
    drizzle,
    sql,
  };
}

function deniedResponse(c: Denied | null) {
  // Say WHO the server saw — distinguishes "logged into the wrong account"
  // from "role not promoted" at a glance.
  const detail = c ? ` — signed in as ${c.deniedEmail} (role: ${c.deniedRole})` : "";
  return NextResponse.json(
    { ok: false, error: `Admin role required${detail}` },
    { status: 403 },
  );
}

type UserRow = {
  totp_secret: string | null;
  totp_enabled: boolean | null;
  email_otp_hash: string | null;
  email_otp_expires: string | null;
};

async function readTotp(c: Ctx): Promise<UserRow> {
  const r = rows<UserRow>(
    await c.drizzle.execute(
      c.sql.raw(
        `SELECT totp_secret, totp_enabled, email_otp_hash, email_otp_expires FROM users WHERE id = ${Number(c.id)} LIMIT 1`,
      ),
    ),
  );
  return r[0] ?? { totp_secret: null, totp_enabled: false, email_otp_hash: null, email_otp_expires: null };
}

/** True if the token is a valid authenticator code (when a secret exists) OR a
 *  valid, unexpired email code. This is what makes app-or-email interchangeable. */
function secondFactorOk(u: UserRow, token: string): boolean {
  if (u.totp_secret && verifyTotp(u.totp_secret, token)) return true;
  if (
    u.email_otp_hash &&
    u.email_otp_expires &&
    new Date(u.email_otp_expires).getTime() > Date.now() &&
    verifyOtpHash(token, u.email_otp_hash)
  ) {
    return true;
  }
  return false;
}

/** Clear a used/expired email code so it can't be replayed. */
async function clearEmailOtp(c: Ctx): Promise<void> {
  await c.drizzle.execute(
    c.sql.raw(`UPDATE users SET email_otp_hash = NULL, email_otp_expires = NULL WHERE id = ${Number(c.id)}`),
  );
}

export async function GET() {
  const c = await ctx();
  if (!c || "deniedEmail" in c) return deniedResponse(c);
  const u = await readTotp(c);
  return NextResponse.json({
    ok: true,
    enabled: Boolean(u.totp_enabled),
    pending: Boolean(u.totp_secret) && !u.totp_enabled,
    method: u.totp_secret ? "app" : u.totp_enabled ? "email" : null,
  });
}

export async function POST(req: NextRequest) {
  const c = await ctx();
  if (!c || "deniedEmail" in c) return deniedResponse(c);

  let body: { action?: string; token?: string };
  try {
    body = (await req.json()) as { action?: string; token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const action = body.action;
  const token = (body.token ?? "").trim();
  const current = await readTotp(c);

  // Set up the authenticator-app method — generate + store a pending secret.
  if (action === "setup") {
    const secret = generateSecret();
    await c.drizzle.execute(
      c.sql.raw(
        `UPDATE users SET totp_secret = ${escStr(secret)}, totp_enabled = false, updated_at = now() WHERE id = ${Number(c.id)}`,
      ),
    );
    return NextResponse.json({ ok: true, secret, otpauth: otpauthUri(secret, c.email) });
  }

  // Email a fresh one-time code (used both to enrol the email method and as a
  // login fallback for the app method). Valid for 5 minutes.
  if (action === "email-otp") {
    const code = generateEmailOtp();
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await c.drizzle.execute(
      c.sql.raw(
        `UPDATE users SET email_otp_hash = ${escStr(hashOtp(code))}, email_otp_expires = ${escStr(expires)} WHERE id = ${Number(c.id)}`,
      ),
    );
    try {
      await sendTwoFactorCodeEmail(c.payload, { email: c.email, code, name: c.name });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Could not send email" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, sentTo: c.email });
  }

  // Turn 2FA on (app or email) / verify at login. Accepts an app code OR a
  // valid emailed code interchangeably.
  if (action === "enable" || action === "verify") {
    if (action === "verify" && !current.totp_enabled) {
      return NextResponse.json({ ok: false, error: "2FA is not enabled" }, { status: 400 });
    }
    if (action === "enable" && !current.totp_secret && !current.email_otp_hash) {
      return NextResponse.json(
        { ok: false, error: "Start setup first (authenticator app or email code)" },
        { status: 400 },
      );
    }
    if (!secondFactorOk(current, token)) {
      return NextResponse.json({ ok: false, error: "Incorrect code — try again" }, { status: 401 });
    }
    if (action === "enable") {
      await c.drizzle.execute(
        c.sql.raw(`UPDATE users SET totp_enabled = true, updated_at = now() WHERE id = ${Number(c.id)}`),
      );
    }
    await clearEmailOtp(c); // one-time codes never reused
    const res = NextResponse.json({ ok: true, enabled: true });
    res.cookies.set(TWOFA_COOKIE, signTwoFactorCookie(c.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return res;
  }

  if (action === "disable") {
    // Require a valid current code (app or email) to switch 2FA off.
    if (current.totp_enabled && !secondFactorOk(current, token)) {
      return NextResponse.json({ ok: false, error: "Incorrect code — try again" }, { status: 401 });
    }
    await c.drizzle.execute(
      c.sql.raw(
        `UPDATE users SET totp_enabled = false, totp_secret = NULL, email_otp_hash = NULL, email_otp_expires = NULL, updated_at = now() WHERE id = ${Number(c.id)}`,
      ),
    );
    const res = NextResponse.json({ ok: true, enabled: false });
    res.cookies.delete(TWOFA_COOKIE);
    return res;
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
