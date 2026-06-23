import "server-only";

import type { NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Authorise a HubSpot sync request. Allowed callers:
 *   1. An admin user (cookie/Bearer set by Payload auth flow).
 *   2. Vercel Cron — the platform sends `Authorization: Bearer
 *      ${CRON_SECRET}` with each scheduled invocation. We accept
 *      that header verbatim so cron can run `/api/hubspot/sync-all`
 *      without an admin session.
 *
 * Returns null on success, or a Response describing the failure
 * which the caller should return verbatim.
 */
export type AuthOk = { ok: true; via: "admin" | "cron" };
export type AuthErr = { ok: false; status: number; error: string };

export async function authorizeAdminOrCron(
  req: NextRequest
): Promise<AuthOk | AuthErr> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  if (
    cronSecret &&
    (authHeader === `Bearer ${cronSecret}` ||
      // Vercel cron also sets x-vercel-cron-signature, but the docs'
      // authoritative auth pattern is Bearer <CRON_SECRET>.
      req.headers.get("x-vercel-cron") === "1")
  ) {
    return { ok: true, via: "cron" };
  }

  // Track why admin auth fails so the 403 is actionable instead of opaque.
  let reason = "no session cookie";
  try {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: await nextHeaders() });
    const role = (user as unknown as { role?: string } | null)?.role;
    if (user && role === "admin") {
      return { ok: true, via: "admin" };
    }
    reason = user
      ? `signed in but role is "${role ?? "unknown"}", not admin`
      : "session cookie missing or expired — please sign in again";
  } catch (err) {
    reason = `auth check failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  const cronHint = cronSecret
    ? ""
    : " (CRON_SECRET is not set in this deployment, so the scheduled sync can't authenticate either)";
  return {
    ok: false,
    status: 403,
    error: `Admin role or CRON_SECRET required — ${reason}${cronHint}`,
  };
}
