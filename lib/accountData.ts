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

export type OrderItem = {
  title: string;
  dose: string | null;
  quantity: number;
};

export type OrderSummary = {
  orderNumber: string;
  total: number | null;
  status: string | null;
  paymentStatus: string | null;
  date: string;
  itemCount: number;
  /* --- detail, shown when the customer expands the row --- */
  items: OrderItem[];
  /** Delivery address as the courier sees it. */
  shippingAddress: string | null;
  /** DPD consignment number, once dispatched. */
  trackingNumber: string | null;
  paymentMethod: string | null;
  discount: number | null;
  /** True once a DPD label exists for the order. */
  dispatched: boolean;
};

/**
 * Parse an order's items_json into line items. Mirrors the admin-side parser:
 * the column holds a JSON array, a JSON object, or (from the HubSpot sync) a
 * plain "Name (dose) x2, …" string, so all three shapes are handled.
 */
function parseItems(raw: unknown): OrderItem[] {
  let val: unknown = raw;
  if (typeof raw === "string") {
    try {
      val = JSON.parse(raw);
    } catch {
      return raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => {
          const m = t.match(/^(.*?)(?:\s*\(([^)]*)\))?\s*[x\u00d7]\s*(\d+)\s*$/i);
          return m
            ? { title: m[1].trim(), dose: (m[2] ?? "").trim() || null, quantity: Number(m[3]) || 1 }
            : { title: t, dose: null, quantity: 1 };
        });
    }
  }
  const arr = Array.isArray(val) ? val : val && typeof val === "object" ? [val] : [];
  const out: OrderItem[] = [];
  for (const el of arr) {
    if (!el || typeof el !== "object") continue;
    const it = el as Record<string, unknown>;
    // The HubSpot sync stores unparseable lines as {note, body} — recover the
    // product name from the raw text rather than dropping the item.
    if (!it.title && !it.name && !it.product && typeof it.body === "string" && it.body.trim()) {
      out.push(...parseItems(it.body));
      continue;
    }
    const title = String(it.title ?? it.name ?? it.product ?? "").trim();
    if (!title) continue;
    out.push({
      title,
      dose:
        (typeof it.dose === "string" && it.dose) ||
        (typeof it.variant === "string" && it.variant) ||
        null,
      quantity: Number(it.quantity ?? it.qty ?? 1) || 1,
    });
  }
  return out;
}

/** The DPD consignment number, which dispatch writes into the notes column. */
function parseTracking(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/DPD tracking:\s*([^\s(]+)/i);
  return m ? m[1] : null;
}

/**
 * The delivery address, from shipping_address or else the "address:" block in
 * notes (checkout has written it both ways). Only address lines are returned —
 * `notes` also carries internal clinical and dispatch commentary, which must
 * never be shown to the customer.
 */
function resolveAddress(shippingAddress: string | null, notes: string | null): string | null {
  const primary = (shippingAddress ?? "").trim();
  if (primary && primary !== "\u2014") return primary;
  const raw = (notes ?? "").trim();
  if (!raw) return null;
  const marker = raw.toLowerCase().indexOf("address:");
  if (marker < 0) return null; // no labelled block — don't guess, and never dump notes
  const block = raw
    .slice(marker + "address:".length)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().startsWith("dpd tracking"))
    .join("\n")
    .trim();
  return block || null;
}

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
      const items = parseItems(pick(r, "items_json", "items"));
      const total = pick(r, "total_amount", "total", "amount");
      const discount = pick(r, "discount_amount", "discountAmount");
      const notes = (pick(r, "notes") as string) ?? null;
      const tracking = parseTracking(notes);
      return {
        orderNumber: String(pick(r, "order_number", "orderNumber", "id") ?? ""),
        total: total != null ? Number(total) : null,
        status: (pick(r, "status") as string) ?? null,
        paymentStatus: (pick(r, "payment_status", "paymentStatus") as string) ?? null,
        date: toIso(pick(r, "created_at", "createdAt")),
        // Sum the quantities, not the line count, so "2 items" means two boxes.
        itemCount: items.reduce((n, it) => n + (it.quantity || 1), 0),
        items,
        shippingAddress: resolveAddress(
          (pick(r, "shipping_address", "shippingAddress") as string) ?? null,
          notes,
        ),
        trackingNumber: tracking,
        paymentMethod: (pick(r, "payment_method", "paymentMethod") as string) ?? null,
        discount: discount != null ? Number(discount) : null,
        dispatched: Boolean(tracking),
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
