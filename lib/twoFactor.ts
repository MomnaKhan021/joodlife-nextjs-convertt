import "server-only";

import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";
import { verifyTwoFactorCookie, TWOFA_COOKIE } from "@/lib/totp";

/**
 * True when the current admin has 2FA switched on but hasn't passed it this
 * session (no valid signed cookie) — i.e. they should be sent to the verify
 * screen. Shared by the /admin-tools layout and the Payload CMS layout so 2FA
 * is enforced no matter which admin surface they log in through.
 *
 * Fail-open: any auth/DB error returns false so a hiccup never locks an admin
 * out of the portal. 2FA is opt-in, so this only ever gates admins who enabled
 * it (recovery: set users.totp_enabled = false).
 */
export async function requiresTwoFactor(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as { drizzle?: { execute: (q: unknown) => Promise<unknown> } }
    ).drizzle;
    if (!drizzle) return false;
    const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };
    const res = await drizzle.execute(
      sql.raw(`SELECT totp_enabled FROM users WHERE id = ${Number(user.id)} LIMIT 1`),
    );
    const list = Array.isArray(res) ? res : ((res as { rows?: unknown[] })?.rows ?? []);
    const enabled = Boolean((list[0] as { totp_enabled?: boolean } | undefined)?.totp_enabled);
    if (!enabled) return false;

    const cookie = (await cookies()).get(TWOFA_COOKIE)?.value;
    return !verifyTwoFactorCookie(cookie, user.id);
  } catch {
    return false;
  }
}
