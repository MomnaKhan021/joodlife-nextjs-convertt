/**
 * GET /api/hubspot/weightlog-test   (admin only)
 *
 * Verifies weight-log → HubSpot sync, which now writes to CONTACT
 * PROPERTIES (jood_latest_weight_kg / jood_last_weight_logged_at /
 * jood_weight_log_history) using the contacts.write scope — no notes
 * scope required.
 *
 *   ?write=1  → performs a live test write to the signed-in admin's own
 *               contact and returns the exact HubSpot result.
 *
 * Read-only without ?write=1.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import {
  isHubSpotEnabled,
  ensureWeightContactProperties,
  syncWeightLogToContact,
  readContactWeightProps,
  WEIGHT_PROP_LATEST,
  WEIGHT_PROP_DATE,
  WEIGHT_PROP_HISTORY,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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
      hint: "HUBSPOT_ACCESS_TOKEN is not set in Vercel env vars.",
    });
  }

  // Try to create the custom properties (needs crm.schemas.contacts.write).
  await ensureWeightContactProperties();

  const properties = {
    latest: WEIGHT_PROP_LATEST,
    date: WEIGHT_PROP_DATE,
    history: WEIGHT_PROP_HISTORY,
  };

  const email = (user as unknown as { email?: string }).email ?? "";
  const doWrite = req.nextUrl.searchParams.get("write") === "1";
  if (!doWrite) {
    // Read back what's actually stored on this admin's contact, so you can
    // see the values regardless of whether they're pinned to the record view.
    const read = await readContactWeightProps(email);
    return NextResponse.json({
      ok: read.ok,
      hasToken: true,
      method: "contact properties",
      properties,
      contact: email,
      storedInHubSpot: read.ok
        ? {
            contactId: read.data.contactId,
            latestWeightKg: read.data.props[WEIGHT_PROP_LATEST] ?? null,
            lastLoggedAt: read.data.props[WEIGHT_PROP_DATE] ?? null,
            history: read.data.props[WEIGHT_PROP_HISTORY] ?? null,
          }
        : { error: read.error, status: read.status },
      hint:
        read.ok && read.data.props[WEIGHT_PROP_LATEST]
          ? "These values ARE stored on your contact. If you don't see them on the record, they just need adding to the layout — see steps below. Add ?write=1 to push a fresh test value."
          : "No weight value found yet on this contact. Add ?write=1 to push a test value, or log a weight on /profile/weight-logs.",
    });
  }

  const res = await syncWeightLogToContact({
    email,
    weightKg: 80,
    loggedAt: new Date().toISOString(),
    customerId: (user as unknown as { id?: string | number }).id ?? null,
  });

  return NextResponse.json({
    ok: res.ok,
    hasToken: true,
    method: "contact properties",
    properties,
    write: res.ok
      ? { ok: true, contactId: res.data.id }
      : { ok: false, status: res.status, error: res.error },
    verdict: res.ok
      ? `Success — wrote weight properties to your contact (${email}). Open that contact in HubSpot; "Latest weight (kg)" is set. If the fields don't show on the record, add them to the layout via Settings → Properties.`
      : `Write failed (${res.status}): ${res.error}. If it mentions a property not existing, create them once in HubSpot (Settings → Properties → Contact) with internal names ${WEIGHT_PROP_LATEST} (number), ${WEIGHT_PROP_DATE} (date), ${WEIGHT_PROP_HISTORY} (multi-line text).`,
  });
}
