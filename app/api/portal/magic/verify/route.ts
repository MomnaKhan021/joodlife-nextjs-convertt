/**
 * POST /api/portal/magic/verify { token } — finishes an emailed-link login.
 *
 * The token is checked against its stored hash (unused, unexpired, patient
 * account, not locked), marked used, and then a session is created exactly
 * as Payload's own login does it (addSessionToUser + getFieldsToSign +
 * jwtSign), so it behaves like any other login: same cookie, same expiry,
 * revoked by logout.
 */
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createLocalReq, getFieldsToSign, jwtSign } from "payload";
import { addSessionToUser } from "payload/shared";

import { getPayloadInstance } from "@/lib/payload";
import { isSameOrigin, fail, readJson } from "@/lib/portal/api";
import { ensurePortalTables, getDb, lit } from "@/lib/portal/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPIRED = "This login link has expired or has already been used. Ask for a new one, or log in with your password.";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail("Cross-origin request rejected", 403);
  const b = await readJson(req);
  const token = String(b.token ?? "").trim();
  if (!token || token.length > 200) return fail(EXPIRED, 401);
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const db = await getDb();
  await ensurePortalTables(db);
  // Claim the link atomically so it can only ever be used once.
  const claimed = await db.query(`
    UPDATE "portal_login_links" SET used_at = now()
    WHERE token_hash = ${lit(hash)} AND used_at IS NULL AND expires_at > now()
    RETURNING user_id, next
  `);
  if (!claimed[0]) return fail(EXPIRED, 401);
  const uid = Number(claimed[0].user_id);

  const payload = await getPayloadInstance();
  const user = (await payload.db.findOne({ collection: "users", where: { id: { equals: uid } } })) as
    | (Record<string, unknown> & { id: number; email: string; role?: string; lockUntil?: string | null })
    | null;
  if (!user || user.role === "admin" || user.role === "staff") return fail(EXPIRED, 401);
  if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
    return fail("This account is temporarily locked. Please try again later or reset your password.", 423);
  }

  const collectionConfig = payload.collections.users.config;
  const localReq = await createLocalReq({}, payload);
  const { sid } = await addSessionToUser({
    collectionConfig,
    payload,
    req: localReq,
    user: user as unknown as Parameters<typeof addSessionToUser>[0]["user"],
  });
  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: user.email,
    sid,
    user: user as unknown as Parameters<typeof getFieldsToSign>[0]["user"],
  });
  const { token: jwt, exp } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  });

  const next = String(claimed[0].next || "/new_profile");
  const res = NextResponse.json({ ok: true, next: next.startsWith("/") && !next.startsWith("//") ? next : "/new_profile" });
  res.cookies.set("payload-token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(exp * 1000),
  });
  return res;
}
