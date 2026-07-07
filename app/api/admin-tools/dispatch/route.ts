/**
 * GET /api/admin-tools/dispatch
 *
 * Powers the Dispatch queue (orders awaiting dispatch) and the Dispatched
 * list (orders with a tracking number). Returns paid, non-cancelled orders
 * with the fields those pages need — including the DPD tracking number,
 * which the dispatch-label flow saves into orders.notes as
 * "DPD tracking: <number> (shipment #…)".
 *
 * Accessible to role "admin" AND "staff".
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

async function authorize() {
  try {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: await nextHeaders() });
    const role = (user as unknown as { role?: string } | null)?.role;
    if (!user || (role !== "admin" && role !== "staff")) return null;
    return user;
  } catch {
    return null;
  }
}

/** Pull the DPD tracking number out of the free-text notes column. */
function parseTracking(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/DPD tracking:\s*([^\s(]+)/i);
  return m ? m[1] : null;
}

type OrderRow = {
  id: number;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  notes: string | null;
  status: string | null;
  total_amount: string | number | null;
  items_json: unknown;
  created_at: string | null;
};

type Item = { title: string | null; dose: string | null; quantity: number };

function normItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      title: (o.title as string) ?? (o.name as string) ?? null,
      dose: (o.dose as string) ?? null,
      quantity: Number(o.quantity ?? 1) || 1,
    };
  });
}

export async function GET() {
  const user = await authorize();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Admin or staff role required" }, { status: 403 });
  }

  try {
    const { drizzle, sql } = await getDrizzle();
    const result = await drizzle.execute(
      sql.raw(`
        SELECT id, order_number, customer_name, customer_email, customer_phone,
               shipping_address, notes, status, total_amount, items_json, created_at
        FROM orders
        WHERE LOWER(COALESCE(status::text, '')) NOT IN ('cancelled', 'refunded')
          AND COALESCE(total_amount, 0) > 0
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 300
      `),
    );
    const rows = rowsOf<OrderRow>(result);

    const orders = rows.map((r) => {
      const statusText = String(r.status ?? "").toLowerCase();
      const trackingNumber = parseTracking(r.notes);
      const dispatched =
        ["shipped", "delivered", "dispatched"].includes(statusText) ||
        Boolean(trackingNumber);
      return {
        id: r.id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerPhone: r.customer_phone,
        shippingAddress: r.shipping_address,
        status: statusText,
        total: Number(r.total_amount ?? 0) || 0,
        createdAt: r.created_at,
        trackingNumber,
        dispatched,
        items: normItems(r.items_json),
      };
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Read failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
