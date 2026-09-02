import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { hideBeforeSql } from "@/lib/adminHide";
import { resolveAnalyticsRange } from "@/lib/analyticsRange";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin-tools/metrics?days=<1|7|30|90>
 *     or   ?from=YYYY-MM-DD&to=YYYY-MM-DD   (custom range, inclusive days)
 *
 * Daily-monitoring KPIs for the analytics dashboard, computed live from
 * the orders / consultations / users tables:
 *   revenue, orders, AOV, consultations, approved, declined, pending,
 *   conversion rate (consultations → orders), repeat order rate,
 *   new customers — plus a bucketed time series for the charts
 *   (hourly buckets for days=1, daily buckets otherwise).
 *
 * Accessible to role "admin" AND role "staff" (analytics-only accounts).
 */

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

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
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
    // Payload unavailable (e.g. missing env) — treat as unauthorised
    // rather than throwing an unhandled 500.
    return null;
  }
}

/** An order that counts towards revenue/conversion (mirrors the storefront
 *  "returning patient" rule: anything not cancelled / refunded / failed). */
function countsAsSale(status: string | null, paymentStatus: string | null) {
  const s = (status ?? "").toLowerCase();
  const p = (paymentStatus ?? "").toLowerCase();
  return s !== "cancelled" && p !== "refunded" && p !== "failed";
}

type OrderRow = {
  created_at: string;
  total_amount: number | string | null;
  status: string | null;
  payment_status: string | null;
  customer_email: string | null;
};
type ConsultRow = { created_at: string; status: string | null };

export async function GET(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Admin or staff role required" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const range = resolveAnalyticsRange(url.searchParams);
  const { days } = range;

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
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

  try {
    // Range: presets run from local midnight N-1 days back through now; a
    // custom range is an inclusive span of calendar days, bounded at both
    // ends so a historic window doesn't also pick up everything since.
    const now = new Date();
    const { start, endExclusive } = range;
    const startIso = start.toISOString();
    const endIso = endExclusive.toISOString();
    const inRange = `created_at >= '${startIso}' AND created_at < '${endIso}'`;

    // Legacy-data hide — the analytics must reflect the same fresh-start view
    // as the rest of the admin (orders / consultations / customers reset to 0
    // until new data comes in). See lib/adminHide.ts.
    const hc = hideBeforeSql("created_at");
    const hideAnd = hc ? ` AND ${hc}` : "";

    const [ordersRes, consultsRes, repeatRes, usersRes] = await Promise.all([
      drizzle.execute(
        sql.raw(
          `SELECT created_at, total_amount, status, payment_status, customer_email
           FROM orders WHERE ${inRange}${hideAnd};`,
        ),
      ),
      drizzle.execute(
        sql.raw(
          `SELECT created_at, status FROM consultations WHERE ${inRange}${hideAnd};`,
        ),
      ),
      drizzle.execute(
        sql.raw(
          `SELECT customer_email AS email, COUNT(*)::int AS n
           FROM orders
           WHERE customer_email IS NOT NULL AND customer_email <> ''
             AND COALESCE(LOWER(status::text), '') <> 'cancelled'
             AND COALESCE(LOWER(payment_status::text), '') NOT IN ('refunded', 'failed')${hideAnd}
           GROUP BY 1;`,
        ),
      ),
      drizzle.execute(
        sql.raw(
          `SELECT COUNT(*)::int AS n FROM users
           WHERE COALESCE(role::text, 'customer') = 'customer' AND ${inRange}${hideAnd};`,
        ),
      ),
    ]);

    const orders = readRows<OrderRow>(ordersRes);
    const consults = readRows<ConsultRow>(consultsRes);
    const repeat = readRows<{ email: string; n: number }>(repeatRes);
    const newCustomers = Number(readRows<{ n: number }>(usersRes)[0]?.n ?? 0);

    // ---- KPIs ------------------------------------------------------
    const sales = orders.filter((o) => countsAsSale(o.status, o.payment_status));
    const revenue = sales.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const aov = sales.length > 0 ? revenue / sales.length : null;

    const approved = consults.filter((c) => (c.status ?? "").toLowerCase() === "approved").length;
    const declined = consults.filter((c) =>
      ["rejected", "declined"].includes((c.status ?? "").toLowerCase()),
    ).length;
    const pending = consults.length - approved - declined;

    const conversionRate =
      consults.length > 0 ? (sales.length / consults.length) * 100 : null;

    const repeatCustomers = repeat.filter((r) => Number(r.n) >= 2).length;
    const repeatRate =
      repeat.length > 0 ? (repeatCustomers / repeat.length) * 100 : null;

    // ---- Time series (hourly for 1 day, daily otherwise) -----------
    const buckets: { label: string; orders: number; revenue: number; consultations: number }[] = [];
    const bucketIndex = new Map<string, number>();

    if (range.hourly) {
      for (let h = 0; h < 24; h++) {
        const key = String(h);
        bucketIndex.set(key, buckets.length);
        buckets.push({ label: `${String(h).padStart(2, "0")}:00`, orders: 0, revenue: 0, consultations: 0 });
      }
    } else {
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        bucketIndex.set(key, buckets.length);
        buckets.push({
          label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          orders: 0,
          revenue: 0,
          consultations: 0,
        });
      }
    }

    const keyFor = (iso: string) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return range.hourly ? String(d.getHours()) : d.toISOString().slice(0, 10);
    };

    for (const o of sales) {
      const k = keyFor(o.created_at);
      const i = k !== null ? bucketIndex.get(k) : undefined;
      if (i !== undefined) {
        buckets[i].orders += 1;
        buckets[i].revenue += Number(o.total_amount) || 0;
      }
    }
    for (const c of consults) {
      const k = keyFor(c.created_at);
      const i = k !== null ? bucketIndex.get(k) : undefined;
      if (i !== undefined) buckets[i].consultations += 1;
    }

    return NextResponse.json({
      ok: true,
      days,
      mode: range.mode,
      from: startIso,
      to: range.mode === "custom" ? endIso : now.toISOString(),
      kpis: {
        revenue,
        orders: sales.length,
        aov,
        consultations: consults.length,
        approved,
        declined,
        pending,
        conversionRate,
        repeatRate,
        newCustomers,
      },
      series: buckets,
    });
  } catch (err) {
    const base = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause ? ` — ${String(err.cause)}` : "";
    return NextResponse.json(
      { ok: false, error: "Metrics query failed", detail: base + cause },
      { status: 500 },
    );
  }
}
