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

export async function getOrdersForEmail(email: string): Promise<OrderSummary[]> {
  const clean = email?.trim().toLowerCase();
  if (!clean) return [];
  const d = await getDrizzle();
  if (!d) return [];
  try {
    const safe = clean.replace(/'/g, "''");
    const res = await d.drizzle.execute(
      d.sql.raw(`
        SELECT order_number, total_amount, status, payment_status, items_json, created_at
        FROM "orders"
        WHERE lower(customer_email) = '${safe}'
        ORDER BY created_at DESC
        LIMIT 50
      `),
    );
    return toRows(res).map((r) => {
      let items: unknown = r.items_json;
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }
      return {
        orderNumber: String(r.order_number ?? ""),
        total: r.total_amount != null ? Number(r.total_amount) : null,
        status: (r.status as string) ?? null,
        paymentStatus: (r.payment_status as string) ?? null,
        date: r.created_at
          ? new Date(r.created_at as string).toISOString()
          : new Date().toISOString(),
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
    const res = await d.drizzle.execute(
      d.sql.raw(`
        SELECT id, product_slug, status, dose, created_at
        FROM "consultations"
        WHERE lower(email) = '${safe}'
        ORDER BY created_at DESC
        LIMIT 50
      `),
    );
    return toRows(res).map((r) => ({
      id: Number(r.id),
      productSlug: (r.product_slug as string) ?? null,
      status: (r.status as string) ?? null,
      dose: (r.dose as string) ?? null,
      date: r.created_at
        ? new Date(r.created_at as string).toISOString()
        : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
