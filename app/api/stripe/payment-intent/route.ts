/**
 * Stripe PaymentIntent — POST /api/stripe/payment-intent
 *
 * Powers the EMBEDDED card form (Stripe Payment Element) on /checkout.
 * The card is entered on our page; Stripe.js tokenises it in-browser so
 * no card data ever touches our server.
 *
 * Flow:
 *   1. /api/checkout has already created the order in `pending` state.
 *   2. Client posts {orderNumber} here.
 *   3. We re-read the order from the DB for the trusted total (we never
 *      trust a client-supplied amount), create/reuse a PaymentIntent,
 *      store its id on the order, and return the client_secret.
 *   4. The client renders <PaymentElement> with that client_secret and
 *      later calls stripe.confirmPayment().
 *   5. The webhook (payment_intent.succeeded) is the source of truth
 *      that flips the order to `paid`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getPayloadInstance } from "@/lib/payload";
import { getStripe, isStripeConfigured, toMinorUnits } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  orderNumber: z.string().regex(/^JL-[A-Z0-9-]+$/i).max(40),
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
async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: { raw: (s: string) => unknown };
}> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  return { drizzle: drizzle as DrizzleLike, sql };
}

const esc = (s: string | null | undefined) =>
  s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";

type OrderItem = { price: number; quantity: number };

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
  const { orderNumber } = parsed.data;

  let drizzle: DrizzleLike;
  let sql: { raw: (s: string) => unknown };
  try {
    const d = await getDrizzle();
    drizzle = d.drizzle;
    sql = d.sql;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "DB init failed", detail: String(err) },
      { status: 500 },
    );
  }

  const orderResult = (await drizzle.execute(
    sql.raw(
      `SELECT id, order_number, customer_email, items_json,
              total_amount, payment_status, stripe_payment_intent_id
       FROM "orders"
       WHERE order_number = ${esc(orderNumber)}
       LIMIT 1`,
    ),
  )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
  const rows = Array.isArray(orderResult) ? orderResult : (orderResult.rows ?? []);
  const order = rows[0];

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: false, error: "Order already paid" }, { status: 409 });
  }

  const items = Array.isArray(order.items_json) ? (order.items_json as OrderItem[]) : [];
  const computedTotal =
    Math.round(items.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100) / 100;
  if (items.length === 0 || Math.abs(computedTotal - Number(order.total_amount)) > 0.01) {
    return NextResponse.json(
      { ok: false, error: "Order total invalid — refusing to charge" },
      { status: 400 },
    );
  }
  const amountMinor = toMinorUnits(Number(order.total_amount));

  const stripe = await getStripe();
  try {
    const existingPi =
      typeof order.stripe_payment_intent_id === "string"
        ? order.stripe_payment_intent_id
        : null;

    let pi;
    if (existingPi) {
      // Reuse the PaymentIntent for this order (keeps the amount fresh)
      pi = await stripe.paymentIntents.update(existingPi, {
        amount: amountMinor,
        metadata: { orderNumber: String(order.order_number), orderId: String(order.id) },
      });
    } else {
      pi = await stripe.paymentIntents.create({
        amount: amountMinor,
        currency: "gbp",
        automatic_payment_methods: { enabled: true },
        receipt_email: order.customer_email ? String(order.customer_email) : undefined,
        metadata: { orderNumber: String(order.order_number), orderId: String(order.id) },
      });
    }

    await drizzle.execute(
      sql.raw(
        `UPDATE "orders"
         SET stripe_payment_intent_id = ${esc(pi.id)},
             payment_status = 'awaiting',
             updated_at = now()
         WHERE id = ${Number(order.id)}`,
      ),
    );

    return NextResponse.json({ ok: true, clientSecret: pi.client_secret, paymentIntentId: pi.id });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Stripe PaymentIntent failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
