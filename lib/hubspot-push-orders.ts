import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { addNoteToContact, createDeal, mapOrderStageId, upsertContact } from "@/lib/hubspot";
import { ensureOrdersSchema, type DrizzleLike, type SqlRaw } from "@/lib/hubspot-sync-runners";

/**
 * One-time backfill: push EXISTING orders from the database up to HubSpot
 * (contact + deal + order note). Idempotent — once an order has a
 * `hubspot_deal_id` it's skipped, so re-running won't create duplicates.
 *
 * This is the reverse direction of sync-all (which PULLS from HubSpot). Used
 * to get historical orders into HubSpot after the push integration was added.
 */

export type PushOrdersResult = {
  total: number;
  pushed: number;
  skipped: number;
  errors: string[];
};

const MAX_ORDERS = 1000;
const TIME_BUDGET_MS = 250_000;

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

function rows<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";

const gbp = (n: number) =>
  `£${Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type OrderRow = {
  id: number;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  items_json: unknown;
  total_amount: string | number | null;
  discount_amount: string | number | null;
  status: string | null;
  payment_method: string | null;
};

type Item = { title?: string; dose?: string | null; quantity?: number; price?: number };

function parseItems(v: unknown): Item[] {
  if (Array.isArray(v)) return v as Item[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function pushAllOrdersToHubSpot(): Promise<PushOrdersResult> {
  const { drizzle, sql } = await getDrizzle();
  await ensureOrdersSchema(drizzle, sql);

  const res = await drizzle.execute(
    sql.raw(
      `SELECT id, order_number, customer_name, customer_email, customer_phone,
              shipping_address, items_json, total_amount, discount_amount,
              status, payment_method
       FROM "orders"
       WHERE customer_email IS NOT NULL AND customer_email <> ''
         AND (hubspot_deal_id IS NULL OR hubspot_deal_id = '')
       ORDER BY created_at DESC
       LIMIT ${MAX_ORDERS};`,
    ),
  );
  const orderRows = rows<OrderRow>(res);

  const out: PushOrdersResult = {
    total: orderRows.length,
    pushed: 0,
    skipped: 0,
    errors: [],
  };
  const start = Date.now();

  for (const o of orderRows) {
    if (Date.now() - start > TIME_BUDGET_MS) {
      out.errors.push(`Time budget reached — ${out.pushed} pushed, rest left for next run.`);
      break;
    }
    const email = String(o.customer_email ?? "").trim();
    if (!email) {
      out.skipped += 1;
      continue;
    }
    const orderNumber = String(o.order_number ?? `#${o.id}`);
    const total = Number(o.total_amount ?? 0);
    const discount = Number(o.discount_amount ?? 0);
    const items = parseItems(o.items_json);
    const [first, ...rest] = String(o.customer_name ?? "").split(" ");

    try {
      await upsertContact({
        email,
        firstName: first || null,
        lastName: rest.join(" ") || null,
        phone: o.customer_phone || null,
        extra: {
          jood_last_order_number: orderNumber,
          jood_last_order_total: total,
        },
      });

      const itemSummary = items
        .map((i) => `${i.title}${i.dose ? ` (${i.dose})` : ""} × ${i.quantity ?? 1}`)
        .join(", ");
      const deal = await createDeal({
        name: `JoodLife — ${orderNumber}`,
        amount: total,
        contactEmail: email,
        dealStage: mapOrderStageId(o.status, null),
        extra: {
          jood_order_number: orderNumber,
          jood_order_items: itemSummary,
          jood_order_status: o.status ?? "",
          jood_payment_method: o.payment_method ?? "",
        },
      });

      // Note with the full order context.
      const itemLines = items
        .map(
          (i) =>
            `<b>${i.title}${i.dose ? ` (${i.dose})` : ""}</b> × ${i.quantity ?? 1}` +
            (i.price != null ? ` — ${gbp(Number(i.price) * (i.quantity ?? 1))}` : ""),
        )
        .join("<br/>");
      const noteBody =
        `<p><b>JoodLife order ${orderNumber}</b><br/>Status: ${o.status ?? "—"} · Payment: ${o.payment_method ?? "—"}</p>` +
        `<hr/><p>${itemLines}</p>` +
        (discount > 0 ? `<p>Discount: −${gbp(discount)}</p>` : "") +
        `<p><b>Total: ${gbp(total)}</b></p>` +
        (o.shipping_address
          ? `<hr/><p><b>Ship to:</b><br/>${String(o.shipping_address).replace(/\n/g, "<br/>")}</p>`
          : "");
      await addNoteToContact(email, noteBody);

      // Mark the order as pushed so re-runs skip it (idempotent).
      if (deal.ok && deal.data.id) {
        await drizzle.execute(
          sql.raw(
            `UPDATE "orders" SET hubspot_deal_id = ${esc(deal.data.id)} WHERE id = ${o.id};`,
          ),
        );
        out.pushed += 1;
      } else {
        out.errors.push(`Order ${orderNumber}: ${"error" in deal ? deal.error : "deal not created"}`);
      }
    } catch (err) {
      out.errors.push(`Order ${orderNumber}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return out;
}
