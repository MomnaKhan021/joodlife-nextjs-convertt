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
import { getMeetingInfoForEmails, isHubSpotEnabled } from "@/lib/hubspot";

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
    // No HubSpot → no times/links; return empty maps rather than error so the
    // queue falls back to submission-order sorting and hides Join buttons.
    return NextResponse.json({ ok: true, times: {}, links: {} });
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

  const info = await getMeetingInfoForEmails(emails);
  const times: Record<string, string | null> = {};
  const links: Record<string, string | null> = {};
  for (const [email, v] of Object.entries(info)) {
    times[email] = v.startsAt;
    links[email] = v.joinUrl;
  }
  return NextResponse.json({ ok: true, times, links });
}
