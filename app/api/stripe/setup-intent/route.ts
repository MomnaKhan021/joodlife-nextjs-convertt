/**
 * Stripe SetupIntent — POST /api/stripe/setup-intent
 *
 * Used for £0 (fully discounted) orders. Stripe cannot charge £0, but a card
 * is still required before an order may be placed, so we verify the card with
 * a zero-amount SetupIntent instead of a payment. The client confirms it with
 * stripe.confirmCardSetup(); if that fails, the order is not finalised.
 *
 * Body: { orderNumber } -> { ok, clientSecret }
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isStripeConfigured, stripeRest } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  orderNumber: z.string().regex(/^JL[A-Z0-9-]+$/i).max(40),
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
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stripe is not configured." },
      { status: 503 },
    );
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin request rejected" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid orderNumber" }, { status: 400 });
  }

  try {
    type SetupIntent = { id: string; client_secret: string | null };
    const si = await stripeRest<SetupIntent>("setup_intents", {
      "payment_method_types[0]": "card",
      usage: "off_session",
      "metadata[order_number]": parsed.data.orderNumber,
    });
    return NextResponse.json({ ok: true, clientSecret: si.client_secret });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not start card verification",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
