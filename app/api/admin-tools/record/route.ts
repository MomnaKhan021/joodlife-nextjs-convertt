/**
 * Admin record CRUD — bypasses Payload's broken admin chrome on
 * Next 16 by talking to the database directly.
 *
 *   GET  /api/admin-tools/record?type=<x>&id=<y>  -> { ok, row }
 *   POST /api/admin-tools/record?type=<x>&id=<y>  -> updates allowed columns
 *        body: { fields: { [columnName]: value } }
 *        when id === "new" creates instead.
 *   DELETE /api/admin-tools/record?type=<x>&id=<y> -> hard delete
 *
 * The whitelist of editable columns lives in EDITABLE_COLUMNS so a
 * malicious request can't, say, escalate role=admin or wipe a hash.
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

function esc(s: string | null | undefined) {
  return s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";
}

function escNum(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "NULL";
  return String(n);
}

function escBool(b: unknown) {
  if (b === null || b === undefined) return "NULL";
  return b ? "TRUE" : "FALSE";
}

type ColumnType = "text" | "textarea" | "number" | "boolean" | "date" | "json";

type Spec = {
  table: string;
  /** columns we send back on GET (everything you can see in the editor) */
  selectColumns: string;
  /** map of column -> type. Only these columns are writable. */
  editableColumns: Record<string, ColumnType>;
};

const SPECS: Record<string, Spec> = {
  orders: {
    table: "orders",
    selectColumns: "*",
    editableColumns: {
      customer_name: "text",
      customer_email: "text",
      customer_phone: "text",
      shipping_address: "textarea",
      total_amount: "number",
      discount_amount: "number",
      payment_method: "text",
      status: "text",
      notes: "textarea",
    },
  },
  consultations: {
    table: "consultations",
    selectColumns: "*",
    editableColumns: {
      email: "text",
      full_name: "text",
      phone: "text",
      date_of_birth: "text",
      product_slug: "text",
      dose: "text",
      status: "text",
    },
  },
  posts: {
    table: "posts",
    selectColumns: "*",
    editableColumns: {
      title: "text",
      slug: "text",
      excerpt: "textarea",
      body_html: "textarea",
      hero_image_url: "text",
      category: "text",
      status: "text",
      published_at: "date",
      meta_title: "text",
      meta_description: "textarea",
    },
  },
  users: {
    table: "users",
    selectColumns: "id, name, email, role, phone, created_at, updated_at",
    editableColumns: {
      name: "text",
      email: "text",
      role: "text",
      phone: "text",
    },
  },
  products: {
    table: "products",
    selectColumns: "*",
    editableColumns: {
      title: "text",
      slug: "text",
      category: "text",
      treatment: "text",
      tagline: "text",
      card_copy: "textarea",
      from_price: "number",
      compare_price: "number",
      subscription_price: "number",
      is_active: "boolean",
      display_order: "number",
      description: "textarea",
      hero_image_url: "text",
      gallery_image_urls: "json",
      variants_json: "json",
    },
  },
  media: {
    table: "media",
    selectColumns: "*",
    editableColumns: {
      alt: "text",
      url: "text",
      mime_type: "text",
    },
  },
  discounts: {
    table: "discounts",
    selectColumns: "*",
    editableColumns: {
      code: "text",
      type: "text",
      value: "number",
      expiry_date: "date",
      is_active: "boolean",
    },
  },
};

function valueLiteral(type: ColumnType, raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") {
    return "NULL";
  }
  switch (type) {
    case "text":
    case "textarea":
      return esc(String(raw));
    case "number":
      return escNum(Number(raw));
    case "boolean":
      return escBool(raw === true || raw === "true" || raw === 1 || raw === "1");
    case "date":
      // Accept either ISO strings or epoch ms
      if (typeof raw === "number") {
        return esc(new Date(raw).toISOString());
      }
      return esc(String(raw));
    case "json":
      try {
        return `${esc(JSON.stringify(raw))}::jsonb`;
      } catch {
        return "NULL";
      }
  }
}

/**
 * The storefront prefers variants from the relational `products_variants`
 * table over the `variants_json` column. The dashboard only edits
 * `variants_json`, so without this the two drift apart and price edits never
 * show on the site. After saving a product we rewrite `products_variants`
 * from the saved JSON so the relational table (the storefront's source of
 * truth) always matches the dashboard. Best-effort: silently no-ops if the
 * table doesn't exist on this deployment.
 */
type VariantLike = {
  label?: unknown;
  price?: unknown;
  compare_price?: unknown;
  stock?: unknown;
};

async function syncProductVariants(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  productId: number,
  variants: unknown
): Promise<void> {
  if (!Number.isFinite(productId)) return;
  const list = Array.isArray(variants) ? (variants as VariantLike[]) : [];
  try {
    // Replace the whole set for this product so removals propagate too.
    await drizzle.execute(
      sql.raw(`DELETE FROM products_variants WHERE _parent_id = ${productId};`)
    );
    if (list.length === 0) return;
    const values = list
      .map((v, i) => {
        const label = esc(String(v.label ?? "").trim());
        const price = escNum(Number(v.price));
        const compare =
          v.compare_price === null ||
          v.compare_price === undefined ||
          v.compare_price === ""
            ? "NULL"
            : escNum(Number(v.compare_price));
        const stock =
          v.stock === null || v.stock === undefined || v.stock === ""
            ? "NULL"
            : escNum(Number(v.stock));
        return `(${productId}, ${i + 1}, ${label}, ${price}, ${compare}, ${stock})`;
      })
      .join(", ");
    await drizzle.execute(
      sql.raw(
        `INSERT INTO products_variants (_parent_id, _order, label, price, compare_price, stock)
         VALUES ${values};`
      )
    );
  } catch {
    /* table missing on this deployment → variants_json fallback still works */
  }
}

/** Read the relational variants back as the JSON shape the editor expects. */
async function readProductVariants(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  productId: number
): Promise<VariantLike[]> {
  try {
    const res = await drizzle.execute(
      sql.raw(
        `SELECT label, price, compare_price, stock
         FROM products_variants WHERE _parent_id = ${productId}
         ORDER BY _order ASC;`
      )
    );
    return readRows<VariantLike>(res);
  } catch {
    return [];
  }
}

async function authorize() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "").trim();
  const id = (url.searchParams.get("id") ?? "").trim();
  const spec = SPECS[type];
  if (!spec) {
    return NextResponse.json(
      { ok: false, error: `Unknown type "${type}"` },
      { status: 400 }
    );
  }
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id required" },
      { status: 400 }
    );
  }
  if (id === "new") {
    return NextResponse.json({
      ok: true,
      row: null,
      editable: spec.editableColumns,
    });
  }

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
    const numId = Number(id);
    const where = Number.isFinite(numId)
      ? `id = ${numId}`
      : `CAST(id AS TEXT) = ${esc(id)}`;
    const result = await drizzle.execute(
      sql.raw(
        `SELECT ${spec.selectColumns} FROM "${spec.table}" WHERE ${where} LIMIT 1;`
      )
    );
    const row = readRows<Record<string, unknown>>(result)[0] ?? null;
    // For products, the storefront's source of truth is the relational
    // products_variants table. If variants_json is empty but relational
    // variants exist, surface those so the editor shows the real current
    // prices (and a save won't silently wipe them).
    if (row && type === "products") {
      const jsonVariants = Array.isArray(row.variants_json)
        ? (row.variants_json as unknown[])
        : [];
      if (jsonVariants.length === 0 && Number.isFinite(Number(row.id))) {
        const relational = await readProductVariants(drizzle, sql, Number(row.id));
        if (relational.length > 0) row.variants_json = relational;
      }
    }
    return NextResponse.json({
      ok: true,
      row,
      editable: spec.editableColumns,
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

export async function POST(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "").trim();
  const id = (url.searchParams.get("id") ?? "").trim();
  const spec = SPECS[type];
  if (!spec) {
    return NextResponse.json(
      { ok: false, error: `Unknown type "${type}"` },
      { status: 400 }
    );
  }

  let body: { fields?: Record<string, unknown> };
  try {
    body = (await req.json()) as { fields?: Record<string, unknown> };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const fields = body.fields ?? {};

  // Sanitise to only the whitelisted writable columns
  const writePairs: Array<[string, ColumnType, unknown]> = [];
  for (const [col, val] of Object.entries(fields)) {
    const type = spec.editableColumns[col];
    if (!type) continue;
    writePairs.push([col, type, val]);
  }
  if (writePairs.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No writable fields supplied" },
      { status: 400 }
    );
  }

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
    if (id === "new") {
      const cols = writePairs.map(([c]) => c);
      const vals = writePairs.map(([, t, v]) => valueLiteral(t, v));
      const stmt = `
        INSERT INTO "${spec.table}" (${cols.join(", ")}, updated_at, created_at)
        VALUES (${vals.join(", ")}, now(), now())
        RETURNING id;
      `;
      const result = await drizzle.execute(sql.raw(stmt));
      const row = readRows<{ id: number | string }>(result)[0];
      if (type === "products" && row?.id != null && "variants_json" in fields) {
        await syncProductVariants(drizzle, sql, Number(row.id), fields.variants_json);
      }
      return NextResponse.json({ ok: true, id: row?.id ?? null, created: true });
    }

    const numId = Number(id);
    const where = Number.isFinite(numId)
      ? `id = ${numId}`
      : `CAST(id AS TEXT) = ${esc(id)}`;
    const setClause = writePairs
      .map(([c, t, v]) => `${c} = ${valueLiteral(t, v)}`)
      .join(", ");
    const stmt = `
      UPDATE "${spec.table}"
      SET ${setClause}, updated_at = now()
      WHERE ${where}
      RETURNING id;
    `;
    const result = await drizzle.execute(sql.raw(stmt));
    const row = readRows<{ id: number | string }>(result)[0];
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Row not found" },
        { status: 404 }
      );
    }
    if (type === "products" && "variants_json" in fields) {
      await syncProductVariants(drizzle, sql, Number(row.id), fields.variants_json);
    }
    return NextResponse.json({ ok: true, id: row.id, created: false });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Save failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "").trim();
  const id = (url.searchParams.get("id") ?? "").trim();
  const spec = SPECS[type];
  if (!spec || !id) {
    return NextResponse.json(
      { ok: false, error: "type + id required" },
      { status: 400 }
    );
  }

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
    const numId = Number(id);
    const where = Number.isFinite(numId)
      ? `id = ${numId}`
      : `CAST(id AS TEXT) = ${esc(id)}`;
    await drizzle.execute(
      sql.raw(`DELETE FROM "${spec.table}" WHERE ${where};`)
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Delete failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
