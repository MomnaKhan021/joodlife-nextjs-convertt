/**
 * Admin refund — POST /api/admin-tools/refund  { orderId }
 *
 * Admin-only. Issues a FULL Stripe refund against the order's stored
 * PaymentIntent, then marks the order payment_status=refunded /
 * status=cancelled. Never trusts a client-supplied amount.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
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
      `SELECT id, stripe_payment_intent_id, payment_status, payment_method, total_amount
       FROM "orders" WHERE id = ${orderId} LIMIT 1`,
    ),
  );
  const order = rows<Record<string, unknown>>(res)[0];
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
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
    return NextResponse.json({ ok: true, refunded: true, viaStripe: true, refundId: refund.id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Stripe refund failed" },
      { status: 502 },
    );
  }
}
