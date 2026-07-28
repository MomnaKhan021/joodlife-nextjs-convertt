/**
 * GET /api/admin-tools/orders-summary
 *
 * Aggregate KPIs for the Orders view header (Shopify-style cards):
 *   orders     — total non-cancelled orders
 *   items      — total line-item quantity across those orders
 *   fulfilled  — orders dispatched (shipped/delivered/dispatched OR DPD tracking)
 *   delivered  — orders marked delivered
 *   returns    — orders refunded
 *   revenue    — sum of paid order totals
 *   series     — last 14 days of order counts (for the mini sparkline)
 *
 * Admin/staff only. Computed in one lightweight query (id, status,
 * payment_status, items_json, total_amount, created_at) so it doesn't
 * depend on Payload's admin REST layer.
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { hideBeforeSql } from "@/lib/adminHide";

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

/** Best-effort line-item quantity for one order's items_json. */
function itemCount(raw: unknown): number {
  let val: unknown = raw;
  if (typeof raw === "string") {
    try {
      val = JSON.parse(raw);
    } catch {
      return raw.split(",").filter((s) => s.trim()).length || 1;
    }
  }
  if (Array.isArray(val)) {
    return val.reduce((sum: number, it) => {
      const q = Number(
        (it as { quantity?: unknown; qty?: unknown })?.quantity ??
          (it as { qty?: unknown })?.qty ??
          1,
      );
      return sum + (Number.isFinite(q) && q > 0 ? q : 1);
    }, 0);
  }
  if (val && typeof val === "object" && Array.isArray((val as { body?: unknown }).body)) {
    return itemCount((val as { body: unknown }).body);
  }
  return val ? 1 : 0;
}

type Row = {
  status: string | null;
  payment_status: string | null;
  notes: string | null;
  total_amount: string | number | null;
  items_json: unknown;
  created_at: string | null;
};

export async function GET() {
  const user = await authorize();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Admin or staff role required" }, { status: 403 });
  }

  try {
    const { drizzle, sql } = await getDrizzle();
    const res = await drizzle.execute(
      sql.raw(`
        SELECT status, payment_status, notes, total_amount, items_json, created_at
        FROM orders
        WHERE LOWER(COALESCE(status::text, '')) <> 'cancelled'
          ${hideBeforeSql("created_at") ? `AND ${hideBeforeSql("created_at")}` : ""}
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 5000
      `),
    );
    const rows = rowsOf<Row>(res);

    let orders = 0;
    let items = 0;
    let fulfilled = 0;
    let delivered = 0;
    let returns = 0;
    let revenue = 0;

    // 14-day daily buckets for the sparkline (oldest → newest).
    const DAYS = 14;
    const now = new Date();
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const buckets: Record<string, number> = {};
    const order: string[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = dayKey(d);
      buckets[k] = 0;
      order.push(k);
    }

    for (const r of rows) {
      orders += 1;
      items += itemCount(r.items_json);
      const status = String(r.status ?? "").toLowerCase();
      const payment = String(r.payment_status ?? "").toLowerCase();
      const notes = String(r.notes ?? "");
      const isDispatched =
        ["shipped", "delivered", "dispatched"].includes(status) ||
        /DPD tracking:/i.test(notes);
      if (isDispatched) fulfilled += 1;
      if (status === "delivered") delivered += 1;
      if (status === "refunded" || payment === "refunded") returns += 1;
      if (payment === "paid" || status === "paid") revenue += Number(r.total_amount ?? 0) || 0;
      if (r.created_at) {
        const k = dayKey(new Date(r.created_at));
        if (k in buckets) buckets[k] += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      orders,
      items,
      fulfilled,
      delivered,
      returns,
      revenue,
      series: order.map((k) => buckets[k]),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Summary failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
