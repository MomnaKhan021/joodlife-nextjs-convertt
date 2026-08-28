/**
 * Confirm a £0 order — POST /api/checkout/confirm-free
 *
 * A fully discounted order has nothing to charge, but a card is still
 * required, so the browser verifies one with a zero-amount SetupIntent
 * (/api/stripe/setup-intent). This route is what actually marks the order
 * paid — and only after re-checking the SetupIntent with Stripe server-side.
 *
 * The check must happen here, not in the browser: a client could otherwise
 * claim success and get a free order marked paid. Previously the order was
 * written as paid the moment it was created, so a declined or abandoned
 * card still left a "Paid" order in the queue.
 *
 * Body: { orderNumber, setupIntentId } -> { ok: true }
 */
import { NextResponse, type NextRequest, after } from "next/server";
import { z } from "zod";

import { getPayloadInstance } from "@/lib/payload";
import { isStripeConfigured } from "@/lib/stripe";
import { sendOrderConfirmationOnce } from "@/lib/orderConfirmationOnce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  orderNumber: z.string().regex(/^JL[A-Z0-9-]+$/i).max(40),
  setupIntentId: z.string().min(8).max(120),
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

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

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
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const { orderNumber, setupIntentId } = parsed.data;

  // 1. Ask Stripe directly whether that card verification really succeeded.
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/setup_intents/${encodeURIComponent(setupIntentId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Stripe-Version": "2025-09-30.clover",
        },
        cache: "no-store",
      },
    );
    const si = (await res.json()) as {
      status?: string;
      metadata?: { order_number?: string };
    };
    if (!res.ok || si.status !== "succeeded") {
      return NextResponse.json(
        { ok: false, error: "Card was not verified" },
        { status: 402 },
      );
    }
    // The SetupIntent must belong to THIS order.
    if (
      si.metadata?.order_number &&
      si.metadata.order_number.toLowerCase() !== orderNumber.toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, error: "Card verification does not match this order" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not confirm the card" },
      { status: 502 },
    );
  }

  // 2. Mark the order paid — only £0 orders, and only while still unpaid.
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as { drizzle?: DrizzleLike }
    ).drizzle as DrizzleLike;
    const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };
    const safe = orderNumber.replace(/'/g, "''");
    await drizzle.execute(
      sql.raw(
        `UPDATE "orders"
            SET status = 'paid',
                payment_status = 'paid',
                payment_method = 'card',
                -- Marker proving this £0 order's card was really verified.
                -- Historic £0 rows were marked paid by the old buggy flow
                -- without any card check; they carry no marker, so the queues
                -- can tell a genuine free order from an abandoned one.
                notes = COALESCE(NULLIF(CAST(notes AS TEXT), ''), '') ||
                        CASE WHEN COALESCE(CAST(notes AS TEXT),'') = '' THEN '' ELSE E'\n' END ||
                        'Card verified (£0 order)',
                updated_at = now()
          WHERE order_number = '${safe}'
            AND COALESCE(total_amount, 0) <= 0
            AND LOWER(COALESCE(payment_status::text, '')) <> 'paid'`,
      ),
    );
    // Paid at last — now the shopper leaves the Abandoned Checkout queue.
    try {
      await drizzle.execute(
        sql.raw(
          `UPDATE "abandoned_carts" a
              SET recovered_at = now(), updated_at = now()
            FROM "orders" o
            WHERE LOWER(a.email) = LOWER(o.customer_email)
              AND a.recovered_at IS NULL
              AND o.order_number = '${safe}'`,
        ),
      );
    } catch {
      /* non-fatal — never let cart cleanup break the confirmation */
    }

    // Card verified & order marked paid — send the confirmation email
    // (once across all payment-success paths).
    after(async () => {
      await sendOrderConfirmationOnce(payload, drizzle, sql, { orderNumber });
    });

    return NextResponse.json({ ok: true, orderNumber });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not update the order",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
