/**
 * POST /api/discount/auto — the discount the checkout applies on its own.
 *
 * Body: { subtotal: number, email?: string }
 * Returns: { valid, amount, code?, type?, value?, firstOrderOnly? } or { valid: false }
 *
 * Codes marked "apply automatically" in Admin → Discounts are checked with the
 * normal rules (new customers only, once per customer, limits, expiry) and the
 * best one for this basket is returned. Without a typed email the signed-in
 * account's email is used, so returning customers don't see a first-order
 * offer flash up. /api/checkout re-checks the code before charging.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { findAutoDiscount } from "@/lib/discounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  subtotal: z.number().nonnegative().max(1_000_000),
  email: z.string().email().max(200).optional(),
});

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    if (origin) return new URL(origin).host === host;
    if (referer) return new URL(referer).host === host;
  } catch {
    return false;
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ valid: false, amount: 0 }, { status: 403 });
  }
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, amount: 0 }, { status: 400 });
  }
  let email = parsed.data.email ?? null;
  if (!email) email = (await getCurrentUser().catch(() => null))?.email || null;

  const best = await findAutoDiscount(parsed.data.subtotal, { email });
  if (!best) return NextResponse.json({ valid: false, amount: 0 });
  return NextResponse.json({
    valid: true,
    amount: best.amount,
    code: best.code,
    type: best.type,
    value: best.value,
    firstOrderOnly: best.firstOrderOnly === true,
  });
}
