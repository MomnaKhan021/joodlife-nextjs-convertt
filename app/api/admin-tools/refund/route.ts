/**
 * Admin refund — POST /api/admin-tools/refund  { orderId }
 *
 * Admin-only. Issues a FULL Stripe refund against the order's stored
 * PaymentIntent, then marks the order payment_status=refunded /
 * status=cancelled. Never trusts a client-supplied amount.
 */
import { NextResponse, after, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { sendOrderCancelledEmail } from "@/lib/account-email";
import { getPayloadInstance } from "@/lib/payload";
import { isStripeConfigured, stripeRest } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

function rows<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}
const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
  }

  let body: { orderId?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const orderId = Number(body.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid orderId" }, { status: 400 });
  }

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
  try {
    ({ drizzle, sql } = await getDrizzle());
  } catch (e) {
    return NextResponse.json({ ok: false, error: "DB unavailable", detail: String(e) }, { status: 500 });
  }

  const res = await drizzle.execute(
    sql.raw(
      `SELECT id, order_number, customer_name, customer_email, items_json,
              stripe_payment_intent_id, payment_status, payment_method, total_amount
       FROM "orders" WHERE id = ${orderId} LIMIT 1`,
    ),
  );
  const order = rows<Record<string, unknown>>(res)[0];
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  // Tell the customer and the team once the refund is recorded. Runs after the
  // response so a mail hiccup can never undo or delay the refund itself.
  const actor = String((user as { email?: string }).email ?? "").trim() || null;
  const notify = (viaStripe: boolean) =>
    after(async () => {
      try {
        const payload = await getPayloadInstance();
        await sendOrderCancelledEmail(payload, {
          email: order.customer_email as string | null,
          name: order.customer_name as string | null,
          orderNumber: String(order.order_number ?? `#${orderId}`),
          orderId,
          total: Number(order.total_amount ?? 0) || 0,
          refunded: true,
          viaStripe,
          items: Array.isArray(order.items_json)
            ? (order.items_json as Array<{ title?: unknown; dose?: unknown; quantity?: unknown }>)
            : null,
          actor,
        });
      } catch (e) {
        console.error("[refund] cancellation emails failed", e);
      }
    });
  if (order.payment_status === "refunded") {
    return NextResponse.json({ ok: false, error: "Order is already refunded" }, { status: 409 });
  }
  // Free / no-charge orders have nothing to refund at Stripe.
  if (order.payment_method === "test" || !order.stripe_payment_intent_id) {
    await drizzle.execute(
      sql.raw(
        `UPDATE "orders" SET payment_status='refunded', status='cancelled', updated_at=now() WHERE id=${orderId}`,
      ),
    );
    notify(false);
    return NextResponse.json({ ok: true, refunded: true, viaStripe: false });
  }
  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { ok: false, error: `Order is not paid (status: ${order.payment_status}) — nothing to refund.` },
      { status: 400 },
    );
  }

  try {
    const refund = await stripeRest<{ id: string; status: string }>("refunds", {
      payment_intent: String(order.stripe_payment_intent_id),
    });
    await drizzle.execute(
      sql.raw(
        `UPDATE "orders" SET payment_status='refunded', status='cancelled', updated_at=now() WHERE id=${orderId}`,
      ),
    );
    notify(true);
    return NextResponse.json({ ok: true, refunded: true, viaStripe: true, refundId: refund.id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Stripe refund failed" },
      { status: 502 },
    );
  }
}
