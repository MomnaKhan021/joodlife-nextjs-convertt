/**
 * GET /api/hubspot/test
 * Admin-only sanity-check that the HUBSPOT_ACCESS_TOKEN works.
 *
 *   { ok, hasToken, contact: { id, email, firstName, ... } | null,
 *     status, error? }
 *
 * Hits HubSpot's /crm/v3/objects/contacts list with limit=1 and
 * reports back. Useful for catching scope misconfigurations before
 * shipping the integration.
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { isHubSpotEnabled, listContacts } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  if (!isHubSpotEnabled()) {
    return NextResponse.json({
      ok: false,
      hasToken: false,
      error:
        "HUBSPOT_ACCESS_TOKEN not set — add it in Vercel project env vars + redeploy.",
    });
  }

  const res = await listContacts(undefined, 1);
  if (!res.ok) {
    return NextResponse.json({
      ok: false,
      hasToken: true,
      status: res.status,
      error: res.error,
    });
  }
  const first = res.data.results[0] ?? null;
  return NextResponse.json({
    ok: true,
    hasToken: true,
    sampleContact: first
      ? {
          id: first.id,
          email: first.properties.email,
          firstName: first.properties.firstname,
          lastName: first.properties.lastname,
        }
      : null,
    nextAfter: res.data.nextAfter,
  });
}
