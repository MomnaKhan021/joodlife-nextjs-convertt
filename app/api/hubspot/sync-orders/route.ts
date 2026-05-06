/**
 * POST /api/hubspot/sync-orders
 * Admin-only. Pulls Deals (= orders, in our HubSpot model) from
 * HubSpot in pages and upserts them into our `orders` table.
 *
 *   Body (optional): { limit?: number, after?: string }
 *   Returns:        { ok, fetched, inserted, updated, errors, nextAfter }
 *
 * Re-call with the returned `nextAfter` to fetch the next page.
 *
 * Upsert strategy:
 *   1. Match by `hubspot_deal_id` (set on previous syncs)
 *   2. Else match by `order_number` (extracted from
 *      jood_order_number, falling back to dealname)
 *   3. Else INSERT a new row
 *
 * Customer association:
 *   - We keep customer info on the order itself (customerName/Email)
 *   - We also try to attach a `user_id` FK by looking up the email
 *     in the users table (no auto-create — that's what
 *     /sync-contacts is for)
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { isHubSpotEnabled, listDeals, getContactById } from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: SqlRaw;
}> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: SqlRaw;
  };
  return { drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";
}

function escNum(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "NULL";
  return String(n);
}

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

/**
 * Map HubSpot deal stage strings to our internal order status enum.
 * The right-hand side must match the values declared on the
 * Orders collection (`pending`/`paid`/`shipped`/`delivered`/`cancelled`).
 */
function mapStatus(rawStatus: string | undefined, dealStage: string | undefined): string {
  const s = (rawStatus || "").toLowerCase().trim();
  if (
    s === "pending" ||
    s === "paid" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "cancelled"
  ) {
    return s;
  }
  // Common HubSpot deal-stage names we map onto our enum
  const stage = (dealStage || "").toLowerCase();
  if (stage.includes("closedwon") || stage.includes("won")) return "paid";
  if (stage.includes("closedlost") || stage.includes("lost")) return "cancelled";
  if (stage.includes("ship")) return "shipped";
  if (stage.includes("deliver")) return "delivered";
  return "pending";
}

/**
 * Map HubSpot payment-method strings to our internal enum.
 */
function mapPaymentMethod(raw: string | undefined): string {
  const v = (raw || "").toLowerCase().trim();
  const allowed = [
    "test",
    "card",
    "paypal",
    "apple_pay",
    "google_pay",
    "bank_transfer",
  ];
  if (allowed.includes(v)) return v;
  if (v === "applepay") return "apple_pay";
  if (v === "googlepay") return "google_pay";
  if (v === "bank") return "bank_transfer";
  return "test";
}

/**
 * Try to parse the items_json — HubSpot stores it as a string. If it
 * isn't valid JSON we keep the raw text under a single-item shape so
 * nothing blows up downstream.
 */
function parseItemsJson(raw: string | undefined): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [{ note: "raw", body: raw }];
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminOrCron(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" },
      { status: 400 }
    );
  }

  let body: { limit?: number; after?: string };
  try {
    body = (await req.json()) as { limit?: number; after?: string };
  } catch {
    body = {};
  }
  const limit = Math.min(Math.max(Number(body.limit ?? 100), 1), 100);

  const fetched = await listDeals(body.after, limit);
  if (!fetched.ok) {
    return NextResponse.json(
      { ok: false, status: fetched.status, error: fetched.error },
      { status: 502 }
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

  // First-deploy guard: Payload auto-migrates the schema on boot, but
  // if a sync fires before that finishes the new hubspot_deal_id
  // column won't exist yet. Skip the deal-id branch in that case so
  // we still upsert by order_number rather than 500'ing every row.
  let hasDealIdColumn = false;
  try {
    const colCheck = await drizzle.execute(
      sql.raw(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'orders' AND column_name = 'hubspot_deal_id'
         LIMIT 1;`
      )
    );
    hasDealIdColumn = readRows(colCheck).length > 0;
  } catch {
    hasDealIdColumn = false;
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const d of fetched.data.results) {
    const p = d.properties;
    const dealId = d.id;

    try {
      // ------------------------------------------------------------
      // 1. Resolve customer info (deal-level jood_* > associated contact > "")
      // ------------------------------------------------------------
      let customerEmail = (p.jood_customer_email ?? "").trim();
      let customerName = (p.jood_customer_name ?? "").trim();
      let customerPhone = (p.jood_customer_phone ?? "").trim();

      if (!customerEmail && d.contactEmail) customerEmail = d.contactEmail.trim();

      if ((!customerName || !customerPhone) && d.contactId) {
        const c = await getContactById(d.contactId);
        if (c.ok && c.data) {
          if (!customerName) {
            const fn = (c.data.properties.firstname ?? "").trim();
            const ln = (c.data.properties.lastname ?? "").trim();
            customerName = [fn, ln].filter(Boolean).join(" ").trim();
          }
          if (!customerPhone) {
            customerPhone = (c.data.properties.phone ?? "").trim();
          }
          if (!customerEmail) {
            customerEmail = (c.data.properties.email ?? "").trim();
          }
        }
      }

      const orderNumber =
        (p.jood_order_number ?? "").trim() ||
        (p.dealname ?? "").trim() ||
        `HS-${dealId}`;

      const totalAmount = Number(p.amount ?? 0) || 0;
      const discountAmount = Number(p.jood_discount_amount ?? 0) || 0;
      const status = mapStatus(p.jood_order_status, p.dealstage);
      const paymentMethod = mapPaymentMethod(p.jood_payment_method);
      const itemsJson = parseItemsJson(p.jood_order_items);
      const shippingAddress = p.jood_shipping_address ?? null;
      const orderNotes = p.jood_order_notes ?? null;

      // ------------------------------------------------------------
      // 2. Look up the matching user_id (email-based, no auto-create)
      // ------------------------------------------------------------
      let userId: number | null = null;
      if (customerEmail) {
        const userRes = await drizzle.execute(
          sql.raw(`SELECT id FROM "users" WHERE email = ${esc(customerEmail)} LIMIT 1;`)
        );
        const ur = readRows<{ id: number }>(userRes);
        if (ur[0]) userId = ur[0].id;
      }

      const itemsLiteral = esc(JSON.stringify(itemsJson));

      // ------------------------------------------------------------
      // 3. Try UPDATE by hubspot_deal_id (only if column exists)
      // ------------------------------------------------------------
      if (hasDealIdColumn) {
        const updateByDealId = `
          UPDATE "orders"
          SET order_number     = ${esc(orderNumber)},
              customer_name    = COALESCE(${esc(customerName || null)}, customer_name),
              customer_email   = COALESCE(${esc(customerEmail || null)}, customer_email),
              customer_phone   = COALESCE(${esc(customerPhone || null)}, customer_phone),
              shipping_address = COALESCE(${esc(shippingAddress)}, shipping_address),
              items_json       = ${itemsLiteral}::jsonb,
              total_amount     = ${escNum(totalAmount)},
              discount_amount  = ${escNum(discountAmount)},
              payment_method   = ${esc(paymentMethod)},
              status           = ${esc(status)},
              notes            = COALESCE(${esc(orderNotes)}, notes),
              user_id          = COALESCE(${escNum(userId)}, user_id),
              updated_at       = now()
          WHERE hubspot_deal_id = ${esc(dealId)}
          RETURNING id;
        `;
        const updateRes = await drizzle.execute(sql.raw(updateByDealId));
        if (readRows<{ id: number }>(updateRes).length > 0) {
          updated++;
          continue;
        }
      }

      // ------------------------------------------------------------
      // 4. UPDATE by order_number (legacy rows synced before deal id)
      // ------------------------------------------------------------
      const updateByOrderNumber = hasDealIdColumn
        ? `
          UPDATE "orders"
          SET hubspot_deal_id  = ${esc(dealId)},
              customer_name    = COALESCE(${esc(customerName || null)}, customer_name),
              customer_email   = COALESCE(${esc(customerEmail || null)}, customer_email),
              customer_phone   = COALESCE(${esc(customerPhone || null)}, customer_phone),
              shipping_address = COALESCE(${esc(shippingAddress)}, shipping_address),
              items_json       = ${itemsLiteral}::jsonb,
              total_amount     = ${escNum(totalAmount)},
              discount_amount  = ${escNum(discountAmount)},
              payment_method   = ${esc(paymentMethod)},
              status           = ${esc(status)},
              notes            = COALESCE(${esc(orderNotes)}, notes),
              user_id          = COALESCE(${escNum(userId)}, user_id),
              updated_at       = now()
          WHERE order_number = ${esc(orderNumber)}
          RETURNING id;
        `
        : `
          UPDATE "orders"
          SET customer_name    = COALESCE(${esc(customerName || null)}, customer_name),
              customer_email   = COALESCE(${esc(customerEmail || null)}, customer_email),
              customer_phone   = COALESCE(${esc(customerPhone || null)}, customer_phone),
              shipping_address = COALESCE(${esc(shippingAddress)}, shipping_address),
              items_json       = ${itemsLiteral}::jsonb,
              total_amount     = ${escNum(totalAmount)},
              discount_amount  = ${escNum(discountAmount)},
              payment_method   = ${esc(paymentMethod)},
              status           = ${esc(status)},
              notes            = COALESCE(${esc(orderNotes)}, notes),
              user_id          = COALESCE(${escNum(userId)}, user_id),
              updated_at       = now()
          WHERE order_number = ${esc(orderNumber)}
          RETURNING id;
        `;
      const updateRes2 = await drizzle.execute(sql.raw(updateByOrderNumber));
      if (readRows<{ id: number }>(updateRes2).length > 0) {
        updated++;
        continue;
      }

      // ------------------------------------------------------------
      // 5. INSERT new row
      // ------------------------------------------------------------
      const insertStmt = hasDealIdColumn
        ? `
          INSERT INTO "orders"
            (order_number, hubspot_deal_id, customer_name, customer_email,
             customer_phone, user_id, shipping_address, items_json,
             total_amount, discount_amount, payment_method, status,
             notes, updated_at, created_at)
          VALUES
            (${esc(orderNumber)}, ${esc(dealId)},
             ${esc(customerName || null)}, ${esc(customerEmail || null)},
             ${esc(customerPhone || null)}, ${escNum(userId)},
             ${esc(shippingAddress)}, ${itemsLiteral}::jsonb,
             ${escNum(totalAmount)}, ${escNum(discountAmount)},
             ${esc(paymentMethod)}, ${esc(status)},
             ${esc(orderNotes)}, now(), now())
          ON CONFLICT (order_number) DO NOTHING
          RETURNING id;
        `
        : `
          INSERT INTO "orders"
            (order_number, customer_name, customer_email,
             customer_phone, user_id, shipping_address, items_json,
             total_amount, discount_amount, payment_method, status,
             notes, updated_at, created_at)
          VALUES
            (${esc(orderNumber)},
             ${esc(customerName || null)}, ${esc(customerEmail || null)},
             ${esc(customerPhone || null)}, ${escNum(userId)},
             ${esc(shippingAddress)}, ${itemsLiteral}::jsonb,
             ${escNum(totalAmount)}, ${escNum(discountAmount)},
             ${esc(paymentMethod)}, ${esc(status)},
             ${esc(orderNotes)}, now(), now())
          ON CONFLICT (order_number) DO NOTHING
          RETURNING id;
        `;
      const insertRes = await drizzle.execute(sql.raw(insertStmt));
      if (readRows<{ id: number }>(insertRes).length > 0) inserted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(`[hubspot:sync-orders] deal ${dealId} failed:`, message);
      errors.push(`deal ${dealId}: ${message}`);
    }
  }

  // eslint-disable-next-line no-console
  console.info(
    `[hubspot:sync-orders] fetched=${fetched.data.results.length} inserted=${inserted} updated=${updated} errors=${errors.length}`
  );

  return NextResponse.json({
    ok: true,
    fetched: fetched.data.results.length,
    inserted,
    updated,
    errors: errors.slice(0, 10),
    nextAfter: fetched.data.nextAfter,
  });
}
