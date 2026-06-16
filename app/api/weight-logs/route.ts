/**
 * Weight logs — POST /api/weight-logs
 *
 * Records a new current-weight reading for the signed-in customer.
 * Identity comes from the auth cookie (never the request body), so a
 * user can only log against their own account. The WeightLogs collection
 * hook mirrors each new entry to HubSpot.
 *
 * GET /api/weight-logs returns the caller's own entries (newest first) —
 * handy for testing; the page itself reads server-side.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";
import { ensureWeightLogsTable } from "@/lib/weightLogs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  // Accept "82" or 82; coerce, then bound to a sane human range.
  weightKg: z.coerce.number().positive().min(20).max(500),
});

function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  try {
    if (origin) return new URL(origin).host === host;
    if (referer) return new URL(referer).host === host;
  } catch {
    return false;
  }
  // No Origin/Referer (e.g. server-to-server) — allow; auth still required.
  return true;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in to log a weight." },
      { status: 401 }
    );
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin request rejected" },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid weight in kg (between 20 and 500)." },
      { status: 400 }
    );
  }
  const weightKg = Math.round(parsed.data.weightKg * 10) / 10;

  try {
    const payload = await getPayloadInstance();
    // Production never auto-creates the table (push is dev-only), so make sure
    // it exists before the first insert.
    await ensureWeightLogsTable();
    const userId = Number.isNaN(Number(user.id)) ? user.id : Number(user.id);
    const doc = await payload.create({
      collection: "weight-logs",
      data: {
        user: userId,
        customerEmail: user.email,
        weightKg,
        loggedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    });
    return NextResponse.json({
      ok: true,
      entry: { id: doc.id, weightKg, loggedAt: doc.loggedAt },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save your weight. Please try again.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  try {
    const payload = await getPayloadInstance();
    await ensureWeightLogsTable();
    const res = await payload.find({
      collection: "weight-logs",
      where: { customerEmail: { equals: user.email.toLowerCase() } },
      sort: "-loggedAt",
      limit: 500,
      overrideAccess: true,
    });
    return NextResponse.json({
      ok: true,
      entries: res.docs.map((d) => ({
        id: d.id,
        weightKg: d.weightKg,
        loggedAt: d.loggedAt,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
