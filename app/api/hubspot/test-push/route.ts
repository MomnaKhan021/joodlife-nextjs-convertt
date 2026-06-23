/**
 * GET /api/hubspot/test-push   (admin-only diagnostic)
 *
 * Performs a REAL push to HubSpot — upsert a test contact, create a test deal
 * with the jood_* properties, and attach a note — then returns the exact
 * result of each step (ok / HTTP status / HubSpot error message). This is how
 * we see precisely WHY order pushes fail, instead of the error being swallowed
 * by the fire-and-forget path during checkout.
 *
 * Optionally pass ?email=you@example.com to target a specific contact.
 * Read-mostly: it does create a test deal/contact in HubSpot (clearly named).
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  isHubSpotEnabled,
  upsertContact,
  createDeal,
  addNoteToContact,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin sign-in required" }, { status: 403 });
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json({ ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" }, { status: 400 });
  }

  const email =
    req.nextUrl.searchParams.get("email") || "hubspot-test@joodlife.com";
  const stamp = req.nextUrl.searchParams.get("n") || "TEST";
  const orderNumber = `JL-TEST-${stamp}`;

  const contact = await upsertContact({
    email,
    firstName: "HubSpot",
    lastName: "Test",
    extra: { jood_last_order_number: orderNumber, jood_last_order_total: 1 },
  });

  const deal = await createDeal({
    name: `JoodLife — ${orderNumber}`,
    amount: 1,
    contactEmail: email,
    extra: {
      jood_order_number: orderNumber,
      jood_order_items: "Test item × 1",
      jood_order_status: "paid",
      jood_payment_method: "test",
    },
  });

  const note = await addNoteToContact(
    email,
    `<p><b>JoodLife test push</b> — ${orderNumber}</p>`,
  );

  return NextResponse.json({
    ok: contact.ok && deal.ok && note.ok,
    targetEmail: email,
    steps: {
      contact: contact.ok
        ? { ok: true, id: contact.data.id }
        : { ok: false, status: contact.status, error: contact.error },
      deal: deal.ok
        ? { ok: true, id: deal.data.id }
        : { ok: false, status: deal.status, error: deal.error },
      note: note.ok
        ? { ok: true, id: note.data.id }
        : { ok: false, status: note.status, error: note.error },
    },
  });
}
