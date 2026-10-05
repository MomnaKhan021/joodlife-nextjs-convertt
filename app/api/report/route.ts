/**
 * GET /api/report — read-only sales summary for developers and marketing.
 *
 * Aggregates only: order counts, revenue, new vs repeat supply, per-day and
 * per-product totals, consultation outcomes. It never returns names, emails,
 * phone numbers, addresses, payment details or consultation answers.
 *
 * ── Auth ─────────────────────────────────────────────────────────────────
 *   Authorization: Bearer <REPORT_API_TOKEN>
 *
 *   - The token is the REPORT_API_TOKEN environment variable (Vercel). While
 *     it is unset (or shorter than 32 characters) the API is switched off and
 *     answers 503. Rotate it by changing the variable and redeploying.
 *   - A token in the URL (?token= / ?key= / ?api_key= …) is refused on
 *     purpose: URLs are written to browser history and server/proxy logs.
 *   - No CORS headers: call it from a server, a script or a tool (Sheets,
 *     Looker Studio, Zapier…), never from public browser code, which would
 *     expose the token to every visitor.
 *
 * ── Range (same as the admin Analytics page) ────────────────────────────
 *   ?days=1|7|30|90                  preset ending today (default 7)
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD   custom, inclusive, up to 366 days
 *
 * ── Definitions ─────────────────────────────────────────────────────────
 *   order     a REAL order (lib/reorderSql realOrderPredicate): paid, or a
 *             clinical-approval order, or a synced historical purchase —
 *             minus cancelled/refunded. Unpaid checkout attempts are NOT
 *             orders; they are counted separately as `checkoutsStarted`.
 *   revenue   sum of total_amount over orders (after discounts), GBP.
 *   reorder   a repeat supply for that customer (lib/reorderSql).
 *   Records before the go-live cutoff are excluded, matching the dashboard
 *   (lib/adminHide).
 */
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { parseItems } from "@/lib/accountData";
import { hideBeforeSql } from "@/lib/adminHide";
import { resolveAnalyticsRange, ymdLocal } from "@/lib/analyticsRange";
import { getPayloadInstance } from "@/lib/payload";
import { IS_REORDER_SQL, realOrderPredicate } from "@/lib/reorderSql";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIN_TOKEN_LENGTH = 32;
const URL_TOKEN_PARAMS = ["token", "key", "api_key", "apikey", "access_token", "secret"];

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

type OrderRow = {
  created_at: string;
  total_amount: number | string | null;
  discount_amount: number | string | null;
  items_json: unknown;
  is_real: boolean;
  is_reorder: boolean;
  status: string;
  payment_status: string;
};
type ConsultRow = { status: string };

function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

/** Constant-time compare (hashing first equalises the lengths). */
function tokenMatches(header: string | null, expected: string): boolean {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header ?? "");
  if (!m) return false;
  const a = crypto.createHash("sha256").update(m[1]).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

const money = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => Number(v) || 0;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // Refuse URL tokens before anything else — even a correct one. If it is in
  // the URL it is already in a log somewhere; failing loudly gets it moved.
  if (URL_TOKEN_PARAMS.some((p) => params.has(p))) {
    return reply(
      {
        ok: false,
        error:
          "Send the token in the Authorization header (Authorization: Bearer <token>), " +
          "never in the URL. If a real token was put in a URL, ask for it to be rotated.",
      },
      400,
    );
  }

  const expected = process.env.REPORT_API_TOKEN ?? "";
  if (expected.length < MIN_TOKEN_LENGTH) {
    return reply({ ok: false, error: "The reporting API is not configured." }, 503);
  }
  if (!tokenMatches(req.headers.get("authorization"), expected)) {
    return reply({ ok: false, error: "Invalid or missing token." }, 401, {
      "WWW-Authenticate": 'Bearer realm="joodlife-report"',
    });
  }

  // The shared range helper quietly falls back to 7 days on a bad custom
  // range — right for a dashboard, wrong for an API, so reject it instead.
  const range = resolveAnalyticsRange(params);
  if ((params.has("from") || params.has("to")) && range.mode !== "custom") {
    return reply(
      {
        ok: false,
        error: "Invalid range. Use from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive, from <= to, at most 366 days).",
      },
      400,
    );
  }
  if (params.has("days") && range.mode === "preset" && String(range.days) !== params.get("days")) {
    return reply({ ok: false, error: "Invalid days. Use 1, 7, 30 or 90." }, 400);
  }

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
  try {
    const payload = await getPayloadInstance();
    const d = (payload.db as unknown as { drizzle?: DrizzleLike }).drizzle;
    if (!d?.execute) throw new Error("payload.db.drizzle.execute unavailable");
    drizzle = d;
    sql = ((await import("drizzle-orm")) as unknown as { sql: SqlRaw }).sql;
  } catch (err) {
    console.error("[report] database unavailable", err);
    return reply({ ok: false, error: "Database unavailable, try again shortly." }, 503);
  }

  try {
    const startIso = range.start.toISOString();
    const endIso = range.endExclusive.toISOString();
    const hide = hideBeforeSql("created_at");
    const where = `created_at >= '${startIso}' AND created_at < '${endIso}'${hide ? ` AND ${hide}` : ""}`;
    const real = realOrderPredicate('"orders"');

    // customer_email is used INSIDE the query (repeat-supply detection) but is
    // never selected, so no personal data leaves the database.
    const [ordersRes, consultsRes] = await Promise.all([
      drizzle.execute(
        sql.raw(
          `SELECT created_at, total_amount, discount_amount, items_json,
                  ${real} AS is_real,
                  CASE WHEN ${real} THEN ${IS_REORDER_SQL} ELSE false END AS is_reorder,
                  LOWER(COALESCE(status::text, '')) AS status,
                  LOWER(COALESCE(payment_status::text, '')) AS payment_status
             FROM "orders" WHERE ${where};`,
        ),
      ),
      drizzle.execute(
        sql.raw(`SELECT LOWER(COALESCE(status::text, '')) AS status FROM consultations WHERE ${where};`),
      ),
    ]);

    const rows = rowsOf<OrderRow>(ordersRes);
    const consults = rowsOf<ConsultRow>(consultsRes);
    const orders = rows.filter((r) => r.is_real);

    // ---- per-day buckets, every day in the range present (zeros included)
    const daily = new Map<string, { date: string; orders: number; revenue: number; newSupplyOrders: number; reorders: number }>();
    for (let d = new Date(range.start); d < range.endExclusive; d.setDate(d.getDate() + 1)) {
      const date = ymdLocal(d);
      daily.set(date, { date, orders: 0, revenue: 0, newSupplyOrders: 0, reorders: 0 });
    }

    // ---- per-product totals (gross line value, before order discounts)
    const products = new Map<string, { product: string; orders: number; units: number; lineRevenue: number }>();

    let revenue = 0;
    let discounts = 0;
    let reorders = 0;
    for (const o of orders) {
      const total = num(o.total_amount);
      revenue += total;
      discounts += num(o.discount_amount);
      if (o.is_reorder) reorders++;

      const day = daily.get(ymdLocal(new Date(o.created_at)));
      if (day) {
        day.orders++;
        day.revenue += total;
        if (o.is_reorder) day.reorders++;
        else day.newSupplyOrders++;
      }

      const seen = new Set<string>();
      for (const item of parseItems(o.items_json)) {
        const p = products.get(item.title) ?? { product: item.title, orders: 0, units: 0, lineRevenue: 0 };
        p.units += item.quantity;
        if (item.price != null) p.lineRevenue += item.price * item.quantity;
        if (!seen.has(item.title)) {
          p.orders++;
          seen.add(item.title);
        }
        products.set(item.title, p);
      }
    }

    const approved = consults.filter((c) => c.status === "approved").length;
    const declined = consults.filter((c) => c.status === "rejected" || c.status === "declined").length;

    return reply({
      ok: true,
      generatedAt: new Date().toISOString(),
      currency: "GBP",
      range: { from: ymdLocal(range.start), to: ymdLocal(range.endDay), days: range.days },
      totals: {
        orders: orders.length,
        revenue: money(revenue),
        averageOrderValue: orders.length ? money(revenue / orders.length) : null,
        newSupplyOrders: orders.length - reorders,
        reorders,
        discounts: money(discounts),
        checkoutsStarted: rows.length,
        cancelledOrRefunded: rows.filter(
          (r) => r.status === "cancelled" || r.status === "refunded" || r.payment_status === "refunded",
        ).length,
      },
      consultations: {
        total: consults.length,
        approved,
        declined,
        pending: consults.length - approved - declined,
        ordersPerConsultationPct: consults.length ? money((orders.length / consults.length) * 100) : null,
      },
      daily: [...daily.values()].map((d) => ({ ...d, revenue: money(d.revenue) })),
      products: [...products.values()]
        .map((p) => ({ ...p, lineRevenue: money(p.lineRevenue) }))
        .sort((a, b) => b.lineRevenue - a.lineRevenue || b.units - a.units),
    });
  } catch (err) {
    console.error("[report] query failed", err);
    return reply({ ok: false, error: "Report failed, try again shortly." }, 500);
  }
}
