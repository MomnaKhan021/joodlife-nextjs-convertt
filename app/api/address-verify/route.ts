/**
 * Address verification — GET /api/address-verify?street=…&postcode=…&city=…
 *
 * Used by the checkout to tell the customer, before they pay, whether the
 * delivery address they typed is a real UK address. The same check runs again
 * server-side in /api/checkout, so this endpoint is purely for feedback and
 * can't be relied on as the gate.
 */
import { NextResponse, type NextRequest } from "next/server";

import { verifyUkAddress } from "@/lib/addressVerify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const street = (p.get("street") ?? "").slice(0, 200);
  const postcode = (p.get("postcode") ?? "").slice(0, 20);
  const city = (p.get("city") ?? "").slice(0, 100);

  if (!street.trim() || !postcode.trim()) {
    return NextResponse.json({ ok: true, verdict: "unknown" });
  }

  const check = await verifyUkAddress({ street, city, postcode });
  return NextResponse.json({ ok: true, ...check });
}
