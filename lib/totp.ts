import "server-only";

import crypto from "crypto";

/**
 * Dependency-free TOTP (RFC 6238) for admin two-factor auth, plus a small
 * signed-cookie helper for the "2FA passed this session" marker. Uses only
 * Node's built-in crypto — no external packages.
 *
 * TOTP params: SHA-1, 30-second step, 6 digits (the universal authenticator
 * defaults — Google Authenticator, 1Password, Authy, etc.).
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Generate a new base32 TOTP secret (20 random bytes → 32 chars). */
export function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += B32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

/** Decode a base32 string (ignoring spaces/padding/case) to bytes. */
function base32Decode(input: string): Buffer {
  const clean = input.replace(/[=\s]/g, "").toUpperCase();
  let bits = "";
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** HOTP value for a given counter. */
function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  // 8-byte big-endian counter (safe for values well within 2^53).
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

/**
 * Verify a 6-digit token against the secret, allowing ±`window` steps of
 * clock drift (default ±1 = ±30s). Returns true on match.
 */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const t = (token ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(t) || !secret) return false;
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  for (let i = -window; i <= window; i++) {
    if (crypto.timingSafeEqual(Buffer.from(hotp(secret, counter + i)), Buffer.from(t))) {
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Email one-time codes (alternative to the authenticator app)         */
/* ------------------------------------------------------------------ */

/** A fresh 6-digit numeric code to email to the admin. */
export function generateEmailOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** SHA-256 hash of a code (we store the hash, never the plain code). */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

/** Constant-time check of a submitted code against a stored hash. */
export function verifyOtpHash(code: string, hash: string | null | undefined): boolean {
  if (!hash) return false;
  const got = hashOtp(code);
  try {
    return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(hash));
  } catch {
    return false;
  }
}

/** otpauth:// URI for manual entry / QR in an authenticator app. */
export function otpauthUri(secret: string, account: string, issuer = "JoodLife Admin"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/* Signed "2FA passed" session cookie                                  */
/* ------------------------------------------------------------------ */

export const TWOFA_COOKIE = "jl_2fa";
const SESSION_MS = 12 * 60 * 60 * 1000; // re-verify at most every 12h

function cookieSecret(): string {
  return process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || "jood-2fa-fallback";
}

/** Create a tamper-proof cookie value binding a user id + expiry. */
export function signTwoFactorCookie(userId: string): string {
  const exp = Date.now() + SESSION_MS;
  const body = `${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", cookieSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

/** Validate a cookie value for the given user; false if forged/expired. */
export function verifyTwoFactorCookie(value: string | undefined, userId: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [uid, expStr, sig] = parts;
  if (uid !== userId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = crypto.createHmac("sha256", cookieSecret()).update(`${uid}.${expStr}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
