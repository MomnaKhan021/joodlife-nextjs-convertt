/**
 * POST /api/discount  — validate a discount code for the checkout UI.
 *
 * Body: { code: string, subtotal: number }
 * Returns: { valid, amount, reason?, code?, type?, value? }
 *
 * This only previews the discount so the summary can show it. The order's
 * real discount is recomputed and applied server-side in /api/checkout, so
 * a tampered client can never change what's actually charged.
 *
 * NB: the path is /api/discount (singular) — distinct from Payload's REST
 * collection at /api/discounts (plural), so it doesn't shadow it.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { applyDiscountCode } from "@/lib/discounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().nonnegative().max(1_000_000),
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
    return NextResponse.json(
      { valid: false, amount: 0, reason: "Cross-origin request rejected" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { valid: false, amount: 0, reason: "Invalid request" },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, amount: 0, reason: "Invalid request" },
      { status: 400 },
    );
  }

  const result = await applyDiscountCode(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result);
}
