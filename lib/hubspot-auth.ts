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

  try {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: await nextHeaders() });
    const role = (user as unknown as { role?: string } | null)?.role;
    if (user && role === "admin") {
      return { ok: true, via: "admin" };
    }
  } catch {
    // fall through
  }

  return { ok: false, status: 403, error: "Admin role or CRON_SECRET required" };
}
