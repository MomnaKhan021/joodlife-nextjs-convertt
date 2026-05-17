/**
 * Stripe Checkout Session — POST /api/stripe/session
 *
 * Flow:
 *   1. Client posts {orderNumber} to this endpoint after /api/checkout
 *      successfully created the order in `pending` state.
 *   2. We re-read the order from the DB to get the trusted line items
 *      and total (we never trust the client to send amounts here).
 *   3. We hand Stripe the line items, our orderNumber as the
 *      metadata, and our own success/cancel URLs.
 *   4. We persist the Stripe session id on the order so we can match
 *      the webhook back to the order later.
 *
 * Security:
 *   - CSRF/origin guard
 *   - Order must already exist and be unpaid
 *   - Email taken from the saved order, not the request
 *   - All amounts re-computed from items_json (defence in depth)
 *
 * The endpoint returns the session.url that the client should redirect
 * the user to. Stripe handles all card capture / 3DS / wallet flows
 * on their own domain — we never touch a card number.
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

/* ---- Same-origin guard (matches /api/checkout) ---- */
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

type OrderItem = {
  productId: number;
  slug: string;
  title: string;
  dose?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY (server) and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (client).",
      },
      { status: 503 }
    );
  }

  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin request rejected" },
      { status: 403 }
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
    return NextResponse.json(
      { ok: false, error: "Invalid orderNumber" },
      { status: 400 }
    );
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
      { status: 500 }
    );
  }

  // Re-read the order — never trust client-side cart state at this point
  const orderResult = (await drizzle.execute(
    sql.raw(
      `SELECT id, order_number, customer_email, customer_name, items_json,
              total_amount, payment_status, stripe_session_id
       FROM "orders"
       WHERE order_number = ${esc(orderNumber)}
       LIMIT 1`
    )
  )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
  const rows = Array.isArray(orderResult) ? orderResult : (orderResult.rows ?? []);
  const order = rows[0];

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json(
      { ok: false, error: "Order already paid" },
      { status: 409 }
    );
  }

  const items = Array.isArray(order.items_json)
    ? (order.items_json as OrderItem[])
    : [];
  if (items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Order has no items" },
      { status: 400 }
    );
  }

  // Defence-in-depth: recompute the total from items, don't trust
  // total_amount in case it was tampered with between order create
  // and now (it shouldn't be, but cheap to verify).
  const computedTotal =
    Math.round(items.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100) /
    100;
  if (Math.abs(computedTotal - Number(order.total_amount)) > 0.01) {
    return NextResponse.json(
      { ok: false, error: "Order total mismatch — refusing to charge" },
      { status: 500 }
    );
  }

  const stripe = await getStripe();
  const origin = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: String(order.customer_email),
      // Pass-through metadata so the webhook can match back
      client_reference_id: String(order.order_number),
      metadata: {
        orderNumber: String(order.order_number),
        orderId: String(order.id),
      },
      // Build line items from the order's saved items_json
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: toMinorUnits(i.price),
          product_data: {
            name: i.dose ? `${i.title} — ${i.dose}` : i.title,
            metadata: {
              productId: String(i.productId),
              slug: i.slug,
              ...(i.dose ? { dose: i.dose } : {}),
            },
            ...(i.imageUrl
              ? {
                  // Stripe only allows http(s) image URLs; ignore data: blobs.
                  images: i.imageUrl.startsWith("http") ? [i.imageUrl] : [],
                }
              : {}),
          },
        },
      })),
      success_url: `${origin}/checkout/success?orderNumber=${encodeURIComponent(
        String(order.order_number)
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?orderNumber=${encodeURIComponent(
        String(order.order_number)
      )}&cancelled=1`,
      // Expire after 30 minutes so abandoned sessions don't pile up
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // Persist session id on the order so we can correlate it from the
    // webhook even if the user closes their browser before redirecting.
    await drizzle.execute(
      sql.raw(
        `UPDATE "orders"
         SET stripe_session_id = ${esc(session.id)},
             payment_status = 'awaiting',
             updated_at = now()
         WHERE id = ${Number(order.id)}`
      )
    );

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Stripe session create failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
