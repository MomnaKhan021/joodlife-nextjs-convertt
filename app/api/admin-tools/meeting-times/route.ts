/**
 * POST /api/admin-tools/meeting-times
 *
 * Admin-only. Given a list of patient emails, returns each one's booked
 * consultation start time (from the associated HubSpot meeting/appointment) so
 * the Clinical Queue can sort by consultation time.
 *
 * Body: { emails: string[] }  (capped at 60 per request)
 *   -> { ok: true, times: { [email]: string | null } }
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { getMeetingTimesForEmails, isHubSpotEnabled } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 },
    );
  }

  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  if (!isHubSpotEnabled()) {
    // No HubSpot → no scheduled times; return an empty map rather than error so
    // the queue silently falls back to submission-order sorting.
    return NextResponse.json({ ok: true, times: {} });
  }

  let body: { emails?: unknown };
  try {
    body = (await req.json()) as { emails?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const emails = Array.isArray(body.emails)
    ? body.emails.filter((e): e is string => typeof e === "string").slice(0, 60)
    : [];

  const times = await getMeetingTimesForEmails(emails);
  return NextResponse.json({ ok: true, times });
}
