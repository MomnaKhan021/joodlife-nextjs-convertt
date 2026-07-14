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
import {
  generateSecret,
  otpauthUri,
  verifyTotp,
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

async function ctx() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  const role = (user as unknown as { role?: string } | null)?.role;
  if (!user || (role !== "admin" && role !== "staff")) return null;
  const drizzle = (payload.db as unknown as { drizzle?: DrizzleLike }).drizzle as DrizzleLike;
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return {
    id: String((user as unknown as { id: string | number }).id),
    email: String((user as unknown as { email?: string }).email ?? "admin"),
    drizzle,
    sql,
  };
}

type UserRow = { totp_secret: string | null; totp_enabled: boolean | null };

async function readTotp(c: NonNullable<Awaited<ReturnType<typeof ctx>>>): Promise<UserRow> {
  const r = rows<UserRow>(
    await c.drizzle.execute(
      c.sql.raw(`SELECT totp_secret, totp_enabled FROM users WHERE id = ${Number(c.id)} LIMIT 1`),
    ),
  );
  return r[0] ?? { totp_secret: null, totp_enabled: false };
}

export async function GET() {
  const c = await ctx();
  if (!c) return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  const u = await readTotp(c);
  return NextResponse.json({
    ok: true,
    enabled: Boolean(u.totp_enabled),
    pending: Boolean(u.totp_secret) && !u.totp_enabled,
  });
}

export async function POST(req: NextRequest) {
  const c = await ctx();
  if (!c) return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });

  let body: { action?: string; token?: string };
  try {
    body = (await req.json()) as { action?: string; token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const action = body.action;
  const token = (body.token ?? "").trim();
  const current = await readTotp(c);

  if (action === "setup") {
    const secret = generateSecret();
    await c.drizzle.execute(
      c.sql.raw(
        `UPDATE users SET totp_secret = ${escStr(secret)}, totp_enabled = false, updated_at = now() WHERE id = ${Number(c.id)}`,
      ),
    );
    return NextResponse.json({ ok: true, secret, otpauth: otpauthUri(secret, c.email) });
  }

  if (action === "enable" || action === "verify") {
    const secret = current.totp_secret;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "No 2FA secret set up yet" }, { status: 400 });
    }
    if (action === "verify" && !current.totp_enabled) {
      return NextResponse.json({ ok: false, error: "2FA is not enabled" }, { status: 400 });
    }
    if (!verifyTotp(secret, token)) {
      return NextResponse.json({ ok: false, error: "Incorrect code — try again" }, { status: 401 });
    }
    if (action === "enable") {
      await c.drizzle.execute(
        c.sql.raw(`UPDATE users SET totp_enabled = true, updated_at = now() WHERE id = ${Number(c.id)}`),
      );
    }
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
    // Require a valid current code to switch 2FA off (unless never enabled).
    if (current.totp_enabled && !verifyTotp(current.totp_secret ?? "", token)) {
      return NextResponse.json({ ok: false, error: "Incorrect code — try again" }, { status: 401 });
    }
    await c.drizzle.execute(
      c.sql.raw(
        `UPDATE users SET totp_enabled = false, totp_secret = NULL, updated_at = now() WHERE id = ${Number(c.id)}`,
      ),
    );
    const res = NextResponse.json({ ok: true, enabled: false });
    res.cookies.delete(TWOFA_COOKIE);
    return res;
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
