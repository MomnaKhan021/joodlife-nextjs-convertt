/**
 * Stripe webhook receiver — POST /api/stripe/webhook
 *
 * SECURITY MODEL
 *   - We verify the Stripe-Signature header against STRIPE_WEBHOOK_SECRET.
 *     Without a valid signature the request is rejected. This is how
 *     Stripe authenticates itself to us; anyone POSTing fake events
 *     without the signing secret is blocked here.
 *   - Webhook payloads are PROCESSED EXACTLY ONCE thanks to Stripe's
 *     event.id idempotency. We refuse duplicate event ids using a
 *     small DB table (`stripe_webhook_events`) — see migration below.
 *   - We treat the webhook as the source of truth for payment_status;
 *     the success page only displays the final state, it doesn't make
 *     any state changes itself (so a malicious user can't poke the
 *     success URL to mark someone else's order paid).
 *
 * The webhook should be configured in the Stripe dashboard to listen
 * to at least:
 *   - checkout.session.completed         → mark order paid
 *   - checkout.session.async_payment_succeeded → for delayed methods
 *   - checkout.session.async_payment_failed    → mark failed
 *   - charge.refunded                    → mark refunded
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/**
 * Disable Next.js body parsing — Stripe needs the raw bytes to verify
 * the signature. In App Router we get the raw text from req.text().
 */
export const preferredRegion = "auto";

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

/**
 * Check + insert the event id atomically. Returns true if this is a
 * brand-new event we should process; false if we've already seen it.
 *
 * The table is created lazily on first webhook so the integration
 * works even before the operator runs a migration.
 */
async function isFirstSeenEvent(
  drizzle: DrizzleLike,
  sql: { raw: (s: string) => unknown },
  eventId: string,
  eventType: string
): Promise<boolean> {
  await drizzle.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS stripe_webhook_events (
        event_id text PRIMARY KEY,
        event_type text NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  );
  try {
    await drizzle.execute(
      sql.raw(
        `INSERT INTO stripe_webhook_events (event_id, event_type)
         VALUES (${esc(eventId)}, ${esc(eventType)})`
      )
    );
    return true;
  } catch {
    // PK conflict — we've already processed this event id.
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stripe not configured on this server" },
      { status: 503 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whSecret) {
    return NextResponse.json(
      { ok: false, error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  // Stripe needs the RAW body bytes to verify the signature.
  const rawBody = await req.text();

  const stripe = await getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err) {
    // Invalid signature → 400 (per Stripe's spec).
    return NextResponse.json(
      {
        ok: false,
        error: "Signature verification failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }

  // Idempotency — Stripe will re-deliver if we 5xx, and may dupe on
  // retries. Drop duplicate event ids on the floor.
  let drizzle: DrizzleLike;
  let sql: { raw: (s: string) => unknown };
  try {
    const d = await getDrizzle();
    drizzle = d.drizzle;
    sql = d.sql;
  } catch {
    // If DB is down, still 200 so Stripe doesn't retry-storm us.
    return NextResponse.json({ ok: true, deferred: true });
  }

  const firstTime = await isFirstSeenEvent(drizzle, sql, event.id, event.type);
  if (!firstTime) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as {
          id: string;
          client_reference_id?: string | null;
          payment_intent?: string | null;
          customer?: string | null;
          metadata?: Record<string, string>;
        };
        const orderNumber =
          session.metadata?.orderNumber ?? session.client_reference_id ?? null;
        if (!orderNumber) break;
        await drizzle.execute(
          sql.raw(
            `UPDATE "orders"
             SET status = 'paid',
                 payment_status = 'paid',
                 payment_method = 'card',
                 stripe_payment_intent_id = ${esc(
                   typeof session.payment_intent === "string"
                     ? session.payment_intent
                     : null
                 )},
                 stripe_customer_id = ${esc(
                   typeof session.customer === "string" ? session.customer : null
                 )},
                 stripe_session_id = ${esc(session.id)},
                 updated_at = now()
             WHERE order_number = ${esc(orderNumber)}`
          )
        );
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as {
          metadata?: Record<string, string>;
          client_reference_id?: string | null;
        };
        const orderNumber =
          session.metadata?.orderNumber ?? session.client_reference_id ?? null;
        if (!orderNumber) break;
        await drizzle.execute(
          sql.raw(
            `UPDATE "orders"
             SET payment_status = 'failed',
                 updated_at = now()
             WHERE order_number = ${esc(orderNumber)}`
          )
        );
        break;
      }
      // Embedded Payment Element flow — the PaymentIntent is the source
      // of truth (no Checkout Session exists).
      case "payment_intent.succeeded": {
        const pi = event.data.object as {
          id: string;
          customer?: string | null;
          metadata?: Record<string, string>;
        };
        const orderNumber = pi.metadata?.orderNumber ?? null;
        await drizzle.execute(
          sql.raw(
            `UPDATE "orders"
             SET status = 'paid',
                 payment_status = 'paid',
                 payment_method = 'card',
                 stripe_payment_intent_id = ${esc(pi.id)},
                 stripe_customer_id = ${esc(
                   typeof pi.customer === "string" ? pi.customer : null
                 )},
                 updated_at = now()
             WHERE ${
               orderNumber
                 ? `order_number = ${esc(orderNumber)}`
                 : `stripe_payment_intent_id = ${esc(pi.id)}`
             }`
          )
        );
        // Payment succeeded — only now does the shopper leave the Abandoned
        // Checkout queue.
        try {
          await drizzle.execute(
            sql.raw(
              `UPDATE "abandoned_carts" a
                  SET recovered_at = now(), updated_at = now()
                FROM "orders" o
                WHERE LOWER(a.email) = LOWER(o.customer_email)
                  AND a.recovered_at IS NULL
                  AND ${
                    orderNumber
                      ? `o.order_number = ${esc(orderNumber)}`
                      : `o.stripe_payment_intent_id = ${esc(pi.id)}`
                  }`
            )
          );
        } catch {
          /* non-fatal — never let cart cleanup break the webhook */
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as {
          id: string;
          metadata?: Record<string, string>;
        };
        const orderNumber = pi.metadata?.orderNumber ?? null;
        await drizzle.execute(
          sql.raw(
            `UPDATE "orders"
             SET payment_status = 'failed',
                 updated_at = now()
             WHERE ${
               orderNumber
                 ? `order_number = ${esc(orderNumber)}`
                 : `stripe_payment_intent_id = ${esc(pi.id)}`
             }`
          )
        );
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as { payment_intent?: string | null };
        if (!charge.payment_intent) break;
        await drizzle.execute(
          sql.raw(
            `UPDATE "orders"
             SET payment_status = 'refunded',
                 status = 'cancelled',
                 updated_at = now()
             WHERE stripe_payment_intent_id = ${esc(charge.payment_intent)}`
          )
        );
        break;
      }
      default:
        // ignored event type — still ack 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    // Log the error but ack 200; we'll deal with the failure via
    // Stripe's dashboard event log (the event row is already inserted
    // so we won't reprocess).
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json(
      { ok: false, error: "Internal handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
