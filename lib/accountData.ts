import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Read a customer's own orders and consultations for the account page.
 * Matched by email (the same key everything else uses). Tolerant: returns
 * [] if the DB/table is unavailable so the profile page never errors.
 */

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: { raw: (s: string) => unknown };
} | null> {
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle as DrizzleLike | undefined;
    if (!drizzle?.execute) return null;
    const { sql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    return { drizzle, sql };
  } catch {
    return null;
  }
}

function toRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<Record<string, unknown>> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export type OrderSummary = {
  orderNumber: string;
  total: number | null;
  status: string | null;
  paymentStatus: string | null;
  date: string;
  itemCount: number;
};

/** First non-null value among a set of candidate column names. Lets us read
 *  a row from `SELECT *` without knowing the exact column spelling / whether
 *  an optional column (e.g. payment_status) exists in this DB. */
function pick(r: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (k in r && r[k] != null) return r[k];
  }
  return null;
}

function toIso(v: unknown): string {
  if (v) {
    const d = new Date(v as string);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

export async function getOrdersForEmail(email: string): Promise<OrderSummary[]> {
  const clean = email?.trim().toLowerCase();
  if (!clean) return [];
  const d = await getDrizzle();
  if (!d) return [];
  try {
    const safe = clean.replace(/'/g, "''");
    // SELECT * (not a fixed column list) so an absent optional column — e.g.
    // payment_status — can never make the whole query fail and silently wipe
    // the customer's orders.
    const res = await d.drizzle.execute(
      d.sql.raw(`
        SELECT *
        FROM "orders"
        WHERE lower(customer_email) = '${safe}'
        ORDER BY created_at DESC
        LIMIT 50
      `),
    );
    return toRows(res).map((r) => {
      let items: unknown = pick(r, "items_json", "items");
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }
      const total = pick(r, "total_amount", "total", "amount");
      return {
        orderNumber: String(pick(r, "order_number", "orderNumber", "id") ?? ""),
        total: total != null ? Number(total) : null,
        status: (pick(r, "status") as string) ?? null,
        paymentStatus: (pick(r, "payment_status", "paymentStatus") as string) ?? null,
        date: toIso(pick(r, "created_at", "createdAt")),
        itemCount: Array.isArray(items) ? items.length : 0,
      };
    });
  } catch {
    return [];
  }
}

export type ConsultationSummary = {
  id: number;
  productSlug: string | null;
  status: string | null;
  date: string;
  dose: string | null;
};

export async function getConsultationsForEmail(
  email: string,
): Promise<ConsultationSummary[]> {
  const clean = email?.trim().toLowerCase();
  if (!clean) return [];
  const d = await getDrizzle();
  if (!d) return [];
  try {
    const safe = clean.replace(/'/g, "''");
    // SELECT * so an absent optional column (e.g. dose) can't make the query
    // fail and hide the customer's consultations.
    const res = await d.drizzle.execute(
      d.sql.raw(`
        SELECT *
        FROM "consultations"
        WHERE lower(email) = '${safe}'
        ORDER BY created_at DESC
        LIMIT 50
      `),
    );
    return toRows(res).map((r) => ({
      id: Number(pick(r, "id") ?? 0),
      productSlug: (pick(r, "product_slug", "productSlug") as string) ?? null,
      status: (pick(r, "status") as string) ?? null,
      dose: (pick(r, "dose") as string) ?? null,
      date: toIso(pick(r, "created_at", "createdAt")),
    }));
  } catch {
    return [];
  }
}
