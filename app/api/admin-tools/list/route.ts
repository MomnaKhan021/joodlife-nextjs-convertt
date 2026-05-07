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
};

const SPECS: Record<string, SpecRow> = {
  orders: {
    table: "orders",
    columns:
      "id, order_number, customer_name, customer_email, customer_phone, " +
      "total_amount, discount_amount, payment_method, status, created_at, updated_at",
    searchableColumns: ["order_number", "customer_name", "customer_email", "status"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
  },
  consultations: {
    table: "consultations",
    columns:
      "id, email, full_name, phone, date_of_birth, product_slug, dose, " +
      "status, created_at, updated_at",
    searchableColumns: ["email", "full_name", "product_slug", "status"],
    defaultOrderBy: "created_at DESC NULLS LAST, id DESC",
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

  const where = q
    ? "WHERE " +
      spec.searchableColumns
        .map(
          (c) =>
            `CAST(${c} AS TEXT) ILIKE '%${escLike(q)}%' ESCAPE '\\'`
        )
        .join(" OR ")
    : "";

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

  try {
    const [rowsResult, countResult] = await Promise.all([
      drizzle.execute(
        sql.raw(
          `SELECT ${spec.columns} FROM "${spec.table}"
           ${where}
           ORDER BY ${spec.defaultOrderBy}
           LIMIT ${pageSize} OFFSET ${offset};`
        )
      ),
      drizzle.execute(
        sql.raw(
          `SELECT COUNT(*)::int AS n FROM "${spec.table}" ${where};`
        )
      ),
    ]);
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
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Query failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
