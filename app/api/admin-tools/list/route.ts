/**
 * GET /api/admin-tools/list?type=<collection>&q=<search>&page=<n>&pageSize=<n>
 *
 * Admin-only. Returns a paginated, searchable view of the chosen
 * collection straight from raw SQL — bypasses Payload's admin REST
 * surface entirely so it stays usable when the Payload chrome
 * doesn't render (the issue we're seeing with Posts and
 * Consultations on Next 16 + Payload v3).
 *
 * Supported `type` values:
 *   orders, consultations, posts, users, products, media, discounts
 *
 * Each row comes back as plain JSON. The custom data browser at
 * /admin-tools/data-browser renders these with mobile-first
 * stacking, sort/search, and an Edit link straight into the
 * underlying Payload collection page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { hideBeforeSql, HIDE_TYPES } from "@/lib/adminHide";
import { hiddenOrdersSql } from "@/lib/adminHiddenOrders";

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

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

function escLike(s: string) {
  return s.replace(/'/g, "''").replace(/[%_]/g, "\\$&");
}

type SpecRow = {
  table: string;
  columns: string;
  searchableColumns: string[];
  defaultOrderBy: string;
  /**
   * Whitelist of columns the UI may sort by, mapped to the raw SQL
   * expression. Only keys in here are honoured — anything else falls back
   * to defaultOrderBy — so the `sort` param can be inlined safely.
   */
  sortableColumns?: Record<string, string>;
};

/**
 * Is this order a REPEAT supply for the customer?
 *
 * Two signals, either is enough:
 *  1. HubSpot prefixes synced reorder deals in the name ("Reorder — #2948").
 *  2. The same customer email already has an earlier REAL order — which is the
 *     only signal for orders created at checkout (clean JLxxxx numbers had
 *     always shown "New Supply", even for repeat patients).
 *
 * "Real" excludes cancelled orders and never-paid checkouts (a declined card
 * is an abandoned checkout, not a previous supply), but keeps the £0
 * staff-raised orders created on clinical approval.
 */
const IS_REORDER_SQL = `(
  COALESCE(CAST(order_number AS TEXT),'') ILIKE '%reorder%'
  OR (
    "orders".customer_email IS NOT NULL AND TRIM("orders".customer_email) <> ''
    AND EXISTS (
      SELECT 1 FROM "orders" o2
      WHERE LOWER(o2.customer_email) = LOWER("orders".customer_email)
        AND LOWER(COALESCE(o2.status::text,'')) <> 'cancelled'
        AND (
          LOWER(COALESCE(o2.payment_status::text,'')) = 'paid'
          OR COALESCE(CAST(o2.notes AS TEXT),'') ILIKE 'Auto-created on clinical approval%'
        )
        AND (
          o2.created_at < "orders".created_at
          OR (o2.created_at = "orders".created_at AND o2.id < "orders".id)
        )
    )
  )
)`;

  // An order only belongs in this collection once it is REAL: the customer
  // paid, or staff raised it on clinical approval (those are £0/unpaid by
  // design), or it has already been dispatched. A checkout where the payment
  // never completed is an abandoned checkout, not an order, and lives in the
  // Abandoned Checkout queue instead. The rows stay in the database — this is
  // a display filter, like the legacy-data hide.
  const REAL_ORDER_SQL =
    "(LOWER(COALESCE(payment_status::text,'')) = 'paid'" +
    " OR COALESCE(CAST(notes AS TEXT),'') ILIKE 'Auto-created on clinical approval%'" +
    " OR LOWER(COALESCE(status::text,'')) IN ('shipped','delivered')" +
    " OR COALESCE(CAST(notes AS TEXT),'') ILIKE '%DPD tracking:%')";

const SPECS: Record<string, SpecRow> = {
  orders: {
    table: "orders",
    columns:
      "id, order_number, customer_name, customer_email, customer_phone, " +
      "total_amount, discount_amount, payment_method, payment_status, status, " +
      "items_json, notes, created_at, updated_at, " +
      // Has a pharmacist approved supply for this patient? If so the order has
      // moved on to the To Dispatch queue, and the Orders list should say so
      // instead of still reading "Clinical Check".
      "EXISTS (SELECT 1 FROM \"consultations\" c " +
      "  WHERE c.email IS NOT NULL AND TRIM(c.email) <> '' " +
      "    AND LOWER(c.email) = LOWER(\"orders\".customer_email) " +
      "    AND c.answers->>'_review_decision' = 'approved') AS clinically_approved" +
      `, ${IS_REORDER_SQL} AS is_reorder`,
    searchableColumns: ["order_number", "customer_name", "customer_email", "status"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
    sortableColumns: {
      created_at: "created_at",
      order_number: "order_number",
      customer_name: "LOWER(customer_name)",
      total_amount: "total_amount",
      payment_status: "payment_status",
    },
  },
  consultations: {
    table: "consultations",
    columns:
      "id, email, full_name, phone, date_of_birth, product_slug, dose, " +
      "status, created_at, updated_at",
    searchableColumns: ["email", "full_name", "product_slug", "status"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
    sortableColumns: {
      created_at: "created_at",
      full_name: "LOWER(full_name)",
      product_slug: "LOWER(product_slug)",
      status: "status",
    },
  },
  posts: {
    table: "posts",
    columns:
      "id, title, slug, status, category, published_at, created_at, updated_at",
    searchableColumns: ["title", "slug", "status", "category"],
    defaultOrderBy: "published_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC",
  },
  users: {
    table: "users",
    columns: "id, name, email, role, phone, created_at, updated_at",
    searchableColumns: ["name", "email", "role"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
  },
  products: {
    table: "products",
    columns:
      "id, title, slug, category, from_price, is_active, display_order, created_at",
    searchableColumns: ["title", "slug", "category"],
    defaultOrderBy: "display_order ASC NULLS LAST, id ASC",
  },
  media: {
    table: "media",
    columns: "id, alt, url, mime_type, filesize, created_at",
    searchableColumns: ["alt", "url", "mime_type"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
  },
  discounts: {
    table: "discounts",
    columns:
      "id, code, type, value, expiry_date, is_active, created_at",
    searchableColumns: ["code", "type"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
  },
};

export async function GET(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "").trim();
  const spec = SPECS[type];
  if (!spec) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown type "${type}". Supported: ${Object.keys(SPECS).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const q = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Math.min(10000, Number(url.searchParams.get("page") ?? 1) || 1));
  const pageSize = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get("pageSize") ?? 25) || 25)
  );
  const offset = (page - 1) * pageSize;

  // A specific day to filter by (created_at on that calendar date). Only a
  // strict YYYY-MM-DD is accepted, so it's safe to inline.
  const dateParam = (url.searchParams.get("date") ?? "").trim();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : "";

  // Fulfillment filter (orders only). The Orders tab is a job queue of
  // UNFULFILLED work by default; "dispatched" flips it to shipped history.
  // Mirrors the client's fulfillmentOf(): an order counts as dispatched once
  // its status is shipped/delivered OR it has a DPD tracking note.
  const fulfillment = (url.searchParams.get("fulfillment") ?? "").trim();
  // Supply-type filter for orders: "reorder" | "new" (empty = both).
  // HubSpot prefixes repeat supplies in the deal name ("Reorder — #2948"),
  // which is the same signal lib/orderTag.ts uses for the row tag.
  const supply = (url.searchParams.get("supply") ?? "").trim().toLowerCase();

  // Sort — only honoured against the per-spec whitelist; anything else is
  // ignored and defaultOrderBy applies.
  const sortKey = (url.searchParams.get("sort") ?? "").trim();
  const sortDir = (url.searchParams.get("dir") ?? "").trim().toLowerCase() === "asc" ? "ASC" : "DESC";
  const sortCol = spec.sortableColumns?.[sortKey];
  const orderBy = sortCol
    ? `${sortCol} ${sortDir} NULLS LAST, id ${sortDir}`
    : spec.defaultOrderBy;

  const conditions: string[] = [];
  if (q) {
    conditions.push(
      "(" +
        spec.searchableColumns
          .map((c) => `CAST(${c} AS TEXT) ILIKE '%${escLike(q)}%' ESCAPE '\\'`)
          .join(" OR ") +
        ")",
    );
  }
  if (validDate) {
    conditions.push(`created_at::date = '${validDate}'`);
  }
  // Applies to every orders view, including "All".
  if (type === "orders") conditions.push(REAL_ORDER_SQL);
  // Supply rejected in Clinical Check → the order is not going to be
  // fulfilled, so it leaves the Orders queue (the patient is on the Rejected
  // page). Only when there is no approved consultation for the same patient,
  // so a later approved order isn't hidden by an old rejection.
  if (type === "orders") {
    conditions.push(`NOT (
      EXISTS (SELECT 1 FROM "consultations" rc
               WHERE rc.email IS NOT NULL AND TRIM(rc.email) <> ''
                 AND LOWER(rc.email) = LOWER("orders".customer_email)
                 AND rc.answers->>'_review_decision' = 'rejected')
      AND NOT EXISTS (SELECT 1 FROM "consultations" ac
               WHERE ac.email IS NOT NULL AND TRIM(ac.email) <> ''
                 AND LOWER(ac.email) = LOWER("orders".customer_email)
                 AND ac.answers->>'_review_decision' = 'approved')
    )`);
  }
  // Individually removed test rows (lib/adminHiddenOrders).
  if (type === "orders" && hiddenOrdersSql()) conditions.push(hiddenOrdersSql());
  if (type === "orders" && (fulfillment === "unfulfilled" || fulfillment === "dispatched")) {
    const dispatchedExpr =
      "(LOWER(COALESCE(status::text,'')) IN ('shipped','delivered') OR COALESCE(CAST(notes AS TEXT),'') ILIKE '%DPD tracking:%')";
    // Paid, or raised by staff on clinical approval (those are £0/unpaid by
    // design and still need dispatching).
    const paidOrStaffExpr =
      "(LOWER(COALESCE(payment_status::text,'')) = 'paid' OR COALESCE(CAST(notes AS TEXT),'') ILIKE 'Auto-created on clinical approval%')";
    conditions.push(
      fulfillment === "dispatched"
        ? dispatchedExpr
        : // Unfulfilled job queue: not yet dispatched AND not cancelled.
          // NOTE: clinically-approved orders deliberately STAY here — an order
          // only leaves the Orders "To do" list once it is actually dispatched
          // (which stamps status=shipped), not when supply is approved.
          // A never-paid CHECKOUT order is an abandoned checkout, not work to
          // do: the customer reached the payment step and the card was
          // declined (or they walked away). Those belong in Abandoned
          // Checkout. Orders raised by staff on clinical approval are always
          // £0/unpaid by design, so they must stay. Everything remains
          // visible under "All" for the record.
          `NOT ${dispatchedExpr} AND LOWER(COALESCE(status::text,'')) <> 'cancelled' AND ${paidOrStaffExpr}`,
    );
  }
  if (type === "orders" && (supply === "reorder" || supply === "new")) {
    conditions.push(
      supply === "reorder" ? IS_REORDER_SQL : `NOT ${IS_REORDER_SQL}`,
    );
  }
  // Legacy-data hide: keep only rows created at/after the cutoff for the
  // hidden collections (orders / consultations / customers). Rows stay in the
  // DB; this is a reversible display filter. See lib/adminHide.ts. Applied to
  // the Dispatched view too, so bumping the cutoff zeroes every Orders tab
  // (active AND dispatched) for a clean-slate reset.
  const hideCond = HIDE_TYPES.has(type) ? hideBeforeSql("created_at") : "";
  if (hideCond) conditions.push(hideCond);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
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

  const runQueries = (colsExpr: string, whereExpr: string, orderExpr: string) =>
    Promise.all([
      drizzle.execute(
        sql.raw(
          `SELECT ${colsExpr} FROM "${spec.table}" ${whereExpr}
           ORDER BY ${orderExpr} LIMIT ${pageSize} OFFSET ${offset};`
        )
      ),
      drizzle.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "${spec.table}" ${whereExpr};`)),
    ]);

  // Minimal WHERE for the degraded retry: drop the free-text search (its
  // columns are the likeliest to be missing after schema drift), keep only
  // the safe, always-present filters.
  const safeConds: string[] = [];
  if (validDate) safeConds.push(`created_at::date = '${validDate}'`);
  if (type === "orders") safeConds.push(REAL_ORDER_SQL);
  if (type === "orders" && hiddenOrdersSql()) safeConds.push(hiddenOrdersSql());
  if (type === "orders" && (fulfillment === "unfulfilled" || fulfillment === "dispatched")) {
    const dispatchedExpr =
      "(LOWER(COALESCE(status::text,'')) IN ('shipped','delivered') OR COALESCE(CAST(notes AS TEXT),'') ILIKE '%DPD tracking:%')";
    // Paid, or raised by staff on clinical approval (those are £0/unpaid by
    // design and still need dispatching).
    const paidOrStaffExpr =
      "(LOWER(COALESCE(payment_status::text,'')) = 'paid' OR COALESCE(CAST(notes AS TEXT),'') ILIKE 'Auto-created on clinical approval%')";
    safeConds.push(
      fulfillment === "dispatched"
        ? dispatchedExpr
        : `NOT ${dispatchedExpr} AND LOWER(COALESCE(status::text,'')) <> 'cancelled' AND ${paidOrStaffExpr}`
    );
  }
  if (hideCond) safeConds.push(hideCond);
  if (type === "orders" && (supply === "reorder" || supply === "new")) {
    safeConds.push(
      supply === "reorder" ? IS_REORDER_SQL : `NOT ${IS_REORDER_SQL}`,
    );
  }
  const safeWhere = safeConds.length ? `WHERE ${safeConds.join(" AND ")}` : "";

  let rowsResult: unknown;
  let countResult: unknown;
  let degraded: string | null = null;
  try {
    [rowsResult, countResult] = await runQueries(spec.columns, where, orderBy);
  } catch (primaryErr) {
    // A tailored column / search / sort hit a column that doesn't exist in
    // this environment. Fall back to a minimal SELECT * so the tab still
    // loads instead of hard-failing — and report what was skipped.
    degraded = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    try {
      [rowsResult, countResult] = await runQueries("*", safeWhere, "id DESC");
    } catch (fallbackErr) {
      return NextResponse.json(
        {
          ok: false,
          error: "Query failed",
          detail: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        },
        { status: 500 }
      );
    }
  }
  const rows = readRows<Record<string, unknown>>(rowsResult);
  const totalRow = readRows<{ n: number }>(countResult)[0];
  const total = Number(totalRow?.n ?? 0);
  return NextResponse.json({
    ok: true,
    type,
    page,
    pageSize,
    total,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    rows,
    ...(degraded ? { degraded } : {}),
  });
}
