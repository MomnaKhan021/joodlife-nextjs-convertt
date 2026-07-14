/**
 * GET /api/admin-tools/meet-link?email=<patient email>
 *
 * Admin-only. Returns the Google Meet (or other video-call) join link for a
 * patient's booked consultation. The link is created in HubSpot and stored on
 * the Meeting/Appointment object associated with the contact; this reads it
 * back so the Clinical Queue can show a "Join call" button after approval.
 *
 *   -> { ok: true, joinUrl: string | null, startsAt: string | null }
 *
 * joinUrl is null (with ok:true) when no consultation is booked yet.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { getMeetingLinkForContact, isHubSpotEnabled } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

  const email = (new URL(req.url).searchParams.get("email") ?? "").trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "HubSpot is not configured" },
      { status: 503 },
    );
  }

  const res = await getMeetingLinkForContact(email);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    joinUrl: res.data.joinUrl,
    startsAt: res.data.startsAt,
  });
}
