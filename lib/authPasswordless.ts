import "server-only";

import crypto from "crypto";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Passwordless auth helpers. Users sign in via Google or an emailed one-time
 * code; there is no user-facing password. Internally each user still has a
 * Payload password (required by the collection), so we reset it to a fresh
 * random value and immediately call payload.login to mint a normal
 * `payload-token` session — the same token the rest of the app already
 * verifies via payload.auth(). The random password is never shown to anyone.
 */

export const AUTH_COOKIE = "payload-token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 1 week (matches tokenExpiration)

function secret(): string {
  return (
    process.env.PAYLOAD_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    "jood-passwordless-fallback"
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Sign a small JSON payload into a tamper-proof string: base64(json).hmac. */
export function signState(obj: Record<string, unknown>): string {
  const body = b64url(JSON.stringify(obj));
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Verify + parse a value produced by signState. Returns null if tampered. */
export function readState<T = Record<string, unknown>>(raw: string | undefined | null): T | null {
  if (!raw || !raw.includes(".")) return null;
  const [body, sig] = raw.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** HMAC of a value (used to store a code hash, never the code itself). */
export function hashCode(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** A 6-digit numeric one-time code. */
export function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/**
 * Find-or-create the customer for `email` and return a fresh Payload session
 * token. Caller sets it as the `payload-token` cookie.
 */
export async function issueSessionForEmail(
  email: string,
  name?: string | null,
): Promise<{ token: string; exp?: number; created: boolean } | null> {
  const norm = normalizeEmail(email);
  if (!norm || !norm.includes("@")) return null;

  const payload = await getPayloadInstance();
  const found = await payload.find({
    collection: "users",
    where: { email: { equals: norm } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const password = crypto.randomBytes(24).toString("base64url");
  const existing = found.docs[0] as { id: string | number; name?: string | null } | undefined;
  let created = false;

  if (!existing) {
    await payload.create({
      collection: "users",
      data: {
        email: norm,
        password,
        role: "customer",
        ...(name ? { name } : {}),
      },
      overrideAccess: true,
    });
    created = true;
  } else {
    await payload.update({
      collection: "users",
      id: existing.id,
      data: {
        password,
        ...(name && !existing.name ? { name } : {}),
      },
      overrideAccess: true,
    });
  }

  const result = (await payload.login({
    collection: "users",
    data: { email: norm, password },
  })) as { token?: string; exp?: number };

  if (!result?.token) return null;
  return { token: result.token, exp: result.exp, created };
}
