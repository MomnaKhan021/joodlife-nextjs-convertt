/**
 * Immediate payment confirmation — POST /api/stripe/confirm { orderNumber }
 *
 * The webhook (payment_intent.succeeded) is the source of truth for marking an
 * order paid, but it arrives out-of-band: if it is slow, misconfigured, or the
 * signing secret is missing, the order sits on "awaiting" and the customer/staff
 * see the payment stuck "verifying".
 *
 * This endpoint closes that gap. Right after the browser confirms the card, we
 * ask STRIPE (never the client) for the PaymentIntent status and, if it really
 * succeeded, mark the order paid straight away using the same fields as the
 * webhook. The webhook still runs and is idempotent, so it simply finds the
 * order already paid.
 *
 * Security: the amount/status are read from Stripe, not the request body, so a
 * caller cannot mark an unpaid order as paid.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getPayloadInstance } from "@/lib/payload";
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

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
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
  } catch {
    return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 500 });
  }

  const res = (await drizzle.execute(
    sql.raw(
      `SELECT id, payment_status, stripe_payment_intent_id
       FROM "orders" WHERE order_number = ${esc(orderNumber)} LIMIT 1`,
    ),
  )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
  const rows = Array.isArray(res) ? res : (res.rows ?? []);
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: true, paid: true, alreadyPaid: true });
  }

  const piId =
    typeof order.stripe_payment_intent_id === "string"
      ? order.stripe_payment_intent_id
      : null;
  if (!piId) {
    return NextResponse.json({ ok: true, paid: false, status: "no_payment_intent" });
  }

  try {
    // POST with no fields returns the PaymentIntent unchanged (stripeRest is
    // POST-only); the status therefore comes straight from Stripe.
    const pi = await stripeRest<{
      id: string;
      status: string;
      customer?: string | null;
    }>(`payment_intents/${piId}`, {});

    if (pi.status !== "succeeded") {
      return NextResponse.json({ ok: true, paid: false, status: pi.status });
    }

    await drizzle.execute(
      sql.raw(
        `UPDATE "orders"
         SET status = 'paid',
             payment_status = 'paid',
             payment_method = 'card',
             stripe_payment_intent_id = ${esc(pi.id)},
             stripe_customer_id = ${esc(
               typeof pi.customer === "string" ? pi.customer : null,
             )},
             updated_at = now()
         WHERE id = ${Number(order.id)}`,
      ),
    );

    return NextResponse.json({ ok: true, paid: true, status: pi.status });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
