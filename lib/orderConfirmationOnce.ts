import "server-only";

import type { Payload } from "payload";

import { sendOrderConfirmationEmail } from "@/lib/account-email";

/**
 * Send the order-confirmation email exactly once per order, and only AFTER
 * the payment has actually succeeded.
 *
 * The email used to be sent from /api/checkout when the order row was created
 * — i.e. before the card was charged — so a customer whose payment declined
 * (or was still processing) received "order confirmed" for an order that
 * never appears in the dashboard. Now each payment-success path (client
 * confirm, Stripe webhook, £0 confirm-free) calls this instead.
 *
 * Idempotent across all callers: a `confirmation_email_sent` flag on the
 * order is claimed atomically, so however many of the paths fire (webhook +
 * client confirm race is normal) exactly one email goes out.
 */

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";

type OrderRow = {
  id: number | string;
  order_number: string | null;
  customer_email: string | null;
  customer_name: string | null;
  total_amount: number | string | null;
  items_json: unknown;
};

export async function sendOrderConfirmationOnce(
  payload: Payload,
  drizzle: DrizzleLike,
  sql: SqlRaw,
  ref: { orderId?: number; orderNumber?: string; paymentIntentId?: string },
): Promise<void> {
  try {
    let cond: string | null = null;
    if (ref.orderId != null && Number.isFinite(Number(ref.orderId))) {
      cond = `id = ${Number(ref.orderId)}`;
    } else if (ref.orderNumber) {
      cond = `order_number = ${esc(ref.orderNumber)}`;
    } else if (ref.paymentIntentId) {
      cond = `stripe_payment_intent_id = ${esc(ref.paymentIntentId)}`;
    }
    if (!cond) return;

    await drizzle.execute(
      sql.raw(
        `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS confirmation_email_sent boolean`,
      ),
    );

    // Atomic claim: only the first caller for a PAID order gets the row back.
    const res = await drizzle.execute(
      sql.raw(
        `UPDATE "orders"
            SET confirmation_email_sent = true
          WHERE ${cond}
            AND LOWER(COALESCE(payment_status::text, '')) = 'paid'
            AND COALESCE(confirmation_email_sent, false) = false
          RETURNING id, order_number, customer_email, customer_name, total_amount, items_json`,
      ),
    );
    const row = rowsOf<OrderRow>(res)[0];
    if (!row?.customer_email || !row.order_number) return;

    // A reorder is any order beyond the customer's first non-cancelled one.
    let isReorder = false;
    try {
      const countRes = await drizzle.execute(
        sql.raw(
          `SELECT COUNT(*) AS n FROM "orders"
            WHERE LOWER(customer_email) = LOWER(${esc(row.customer_email)})
              AND LOWER(COALESCE(status::text, '')) <> 'cancelled'`,
        ),
      );
      isReorder = Number(rowsOf<{ n: string | number }>(countRes)[0]?.n ?? 0) > 1;
    } catch {
      /* non-fatal */
    }

    const rawItems = Array.isArray(row.items_json) ? row.items_json : [];
    const items = rawItems.map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      return {
        title: String(o.title ?? "Item"),
        dose: o.dose == null ? null : String(o.dose),
        quantity: Math.max(1, Number(o.quantity) || 1),
        price: o.price == null ? null : Number(o.price),
        imageUrl: o.imageUrl == null ? null : String(o.imageUrl),
      };
    });

    await sendOrderConfirmationEmail(payload, {
      email: String(row.customer_email),
      name: row.customer_name,
      orderNumber: String(row.order_number),
      total: Number(row.total_amount ?? 0),
      isReorder,
      items,
    });
  } catch (err) {
    payload?.logger?.error?.({ msg: "Order confirmation email failed (non-fatal)", err });
  }
}
