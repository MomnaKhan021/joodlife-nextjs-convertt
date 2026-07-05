import "server-only";

import crypto from "crypto";

import {
  getContactById,
  type HubSpotConsultationRecord,
  type HubSpotDealRecord,
} from "@/lib/hubspot";

/**
 * Shared per-page sync runners.
 *
 * The individual /api/hubspot/sync-* route handlers and the
 * unified /api/hubspot/sync-all all delegate the actual upsert work
 * to these functions, so:
 *   - Auth check happens ONCE in the route handler.
 *   - sync-all runs the full sweep without an internal fetch round-
 *     trip (which dropped the admin cookie on Vercel and made every
 *     row fail with "Admin role or CRON_SECRET required").
 *   - The DDL guards (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)
 *     run once at the top, so the first sync after a deploy adds
 *     the missing columns rather than waiting for Payload's auto-
 *     migrate to catch up.
 */

export type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
export type SqlRaw = { raw: (s: string) => unknown };

export type PageStats = {
  inserted: number;
  updated: number;
  errors: string[];
};

function esc(s: string | null | undefined) {
  return s === null || s === undefined
    ? "NULL"
    : "'" + s.replace(/'/g, "''") + "'";
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

/* ------------------------------------------------------------------ */
/* Schema guards — run on the first page of every sync                 */
/* ------------------------------------------------------------------ */

let _ordersSchemaEnsured = false;
let _consultationsSchemaEnsured = false;

/**
 * Ensure `hubspot_deal_id` exists on the orders table. Idempotent.
 * Once it has succeeded inside this serverless instance we don't run
 * the DDL again (a serialised flag — re-runs nothing if Payload has
 * already added the column).
 */
export async function ensureOrdersSchema(
  drizzle: DrizzleLike,
  sql: SqlRaw
): Promise<{ added: boolean; alreadyHad: boolean; error: string | null }> {
  if (_ordersSchemaEnsured) {
    return { added: false, alreadyHad: true, error: null };
  }
  try {
    // Check if the column exists first.
    const colCheck = await drizzle.execute(
      sql.raw(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'orders' AND column_name = 'hubspot_deal_id'
         LIMIT 1;`
      )
    );
    const had = readRows(colCheck).length > 0;
    if (!had) {
      await drizzle.execute(
        sql.raw(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS hubspot_deal_id TEXT;`)
      );
      await drizzle.execute(
        sql.raw(
          `CREATE INDEX IF NOT EXISTS idx_orders_hubspot_deal_id ON "orders" (hubspot_deal_id);`
        )
      );
    }
    _ordersSchemaEnsured = true;
    return { added: !had, alreadyHad: had, error: null };
  } catch (err) {
    return {
      added: false,
      alreadyHad: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function ensureConsultationsSchema(
  drizzle: DrizzleLike,
  sql: SqlRaw
): Promise<{ added: boolean; alreadyHad: boolean; error: string | null }> {
  if (_consultationsSchemaEnsured) {
    return { added: false, alreadyHad: true, error: null };
  }
  try {
    const colCheck = await drizzle.execute(
      sql.raw(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'consultations' AND column_name = 'hubspot_object_id'
         LIMIT 1;`
      )
    );
    const had = readRows(colCheck).length > 0;
    if (!had) {
      await drizzle.execute(
        sql.raw(
          `ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS hubspot_object_id TEXT;`
        )
      );
      await drizzle.execute(
        sql.raw(
          `CREATE INDEX IF NOT EXISTS idx_consultations_hubspot_object_id ON "consultations" (hubspot_object_id);`
        )
      );
    }
    _consultationsSchemaEnsured = true;
    return { added: !had, alreadyHad: had, error: null };
  } catch (err) {
    return {
      added: false,
      alreadyHad: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Contacts → users                                                    */
/* ------------------------------------------------------------------ */

export async function runContactsPage(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  contacts: Array<{ id: string; properties: Record<string, string | undefined> }>
): Promise<PageStats> {
  const out: PageStats = { inserted: 0, updated: 0, errors: [] };

  for (const c of contacts) {
    const email = c.properties.email;
    if (!email) continue;
    const firstName = c.properties.firstname ?? "";
    const lastName = c.properties.lastname ?? "";
    const phone = c.properties.phone ?? null;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    try {
      const updateStmt = `
        UPDATE "users"
        SET name = ${esc(fullName || email.split("@")[0])},
            phone = COALESCE(${esc(phone)}, phone),
            updated_at = now()
        WHERE email = ${esc(email)}
        RETURNING id;
      `;
      const updateRes = await drizzle.execute(sql.raw(updateStmt));
      if (readRows<{ id: number }>(updateRes).length > 0) {
        out.updated++;
        continue;
      }

      const hash = crypto.randomBytes(32).toString("hex");
      const salt = crypto.randomBytes(16).toString("hex");
      const insertStmt = `
        INSERT INTO "users"
          (name, email, role, hash, salt, phone, updated_at, created_at)
        VALUES
          (${esc(fullName || email.split("@")[0])}, ${esc(email)},
           'customer', ${esc(hash)}, ${esc(salt)}, ${esc(phone)},
           now(), now())
        ON CONFLICT DO NOTHING
        RETURNING id;
      `;
      const insertRes = await drizzle.execute(sql.raw(insertStmt));
      if (readRows<{ id: number }>(insertRes).length > 0) out.inserted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(`[hubspot:contacts] ${email} failed:`, message);
      out.errors.push(`${email}: ${message}`);
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Deals → orders                                                      */
/* ------------------------------------------------------------------ */

function mapOrderStatus(
  rawStatus: string | undefined,
  dealStage: string | undefined
): string {
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
  const stage = (dealStage || "").toLowerCase();
  if (stage.includes("closedwon") || stage.includes("won")) return "paid";
  if (stage.includes("closedlost") || stage.includes("lost")) return "cancelled";
  if (stage.includes("ship")) return "shipped";
  if (stage.includes("deliver")) return "delivered";
  return "pending";
}

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

function parseItemsJson(raw: string | undefined): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [{ note: "raw", body: raw }];
  }
}

export async function runDealsPage(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  deals: HubSpotDealRecord[],
  opts: { hasDealIdColumn: boolean }
): Promise<PageStats> {
  const { hasDealIdColumn } = opts;
  const out: PageStats = { inserted: 0, updated: 0, errors: [] };

  for (const d of deals) {
    const p = d.properties;
    const dealId = d.id;
    // Declared outside the try so the catch block can tag the error
    // with the step that threw.
    let step: "update-by-deal-id" | "update-by-order-number" | "insert" =
      "update-by-deal-id";

    try {
      let customerEmail = (p.jood_customer_email ?? "").trim();
      let customerName = (p.jood_customer_name ?? "").trim();
      let customerPhone = (p.jood_customer_phone ?? "").trim();

      if (!customerEmail && d.contactEmail) customerEmail = d.contactEmail.trim();

      // The delivery address usually lives on the deal (jood_shipping_address).
      // Orders synced from Shopify, though, carry the address on the contact's
      // standard fields instead — so pull the contact when the deal lacks an
      // address (or name/phone) and compose the delivery address from it.
      let contactAddress = "";
      const dealAddress = (p.jood_shipping_address ?? "").trim();
      if ((!customerName || !customerPhone || !dealAddress) && d.contactId) {
        const c = await getContactById(d.contactId);
        if (c.ok && c.data) {
          const cp = c.data.properties;
          if (!customerName) {
            const fn = (cp.firstname ?? "").trim();
            const ln = (cp.lastname ?? "").trim();
            customerName = [fn, ln].filter(Boolean).join(" ").trim();
          }
          if (!customerPhone) {
            customerPhone = (cp.phone ?? "").trim();
          }
          if (!customerEmail) {
            customerEmail = (cp.email ?? "").trim();
          }
          contactAddress = [cp.address, cp.city, cp.state, cp.zip, cp.country]
            .map((v) => (v ?? "").trim())
            .filter(Boolean)
            .join("\n");
        }
      }

      const orderNumber =
        (p.jood_order_number ?? "").trim() ||
        (p.dealname ?? "").trim() ||
        `HS-${dealId}`;

      const totalAmount = Number(p.amount ?? 0) || 0;
      const discountAmount = Number(p.jood_discount_amount ?? 0) || 0;
      const status = mapOrderStatus(p.jood_order_status, p.dealstage);
      const paymentMethod = mapPaymentMethod(p.jood_payment_method);
      const itemsJson = parseItemsJson(p.jood_order_items);
      const shippingAddress = dealAddress || contactAddress || null;
      const orderNotes = p.jood_order_notes ?? null;

      let userId: number | null = null;
      if (customerEmail) {
        const userRes = await drizzle.execute(
          sql.raw(
            `SELECT id FROM "users" WHERE email = ${esc(customerEmail)} LIMIT 1;`
          )
        );
        const ur = readRows<{ id: number }>(userRes);
        if (ur[0]) userId = ur[0].id;
      }

      const itemsLiteral = esc(JSON.stringify(itemsJson));

      // 1. UPDATE by hubspot_deal_id (only if column exists)
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
          out.updated++;
          continue;
        }
      }

      step = "update-by-order-number";
      // 2. UPDATE by order_number (legacy / first sync)
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
        out.updated++;
        continue;
      }

      step = "insert";
      // 3. INSERT new row
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
          ON CONFLICT DO NOTHING
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
          ON CONFLICT DO NOTHING
          RETURNING id;
        `;
      const insertRes = await drizzle.execute(sql.raw(insertStmt));
      if (readRows<{ id: number }>(insertRes).length > 0) out.inserted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(
        `[hubspot:orders] deal ${dealId} (${step}) failed:`,
        message
      );
      out.errors.push(`deal ${dealId} [${step}]: ${message}`);
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Consultations → consultations table                                 */
/* ------------------------------------------------------------------ */

function mapConsultationStatus(raw: string | undefined): string {
  const s = (raw || "").toLowerCase().trim();
  const allowed = ["draft", "submitted", "reviewed", "approved", "rejected"];
  return allowed.includes(s) ? s : "submitted";
}

function parseAnswers(raw: string | undefined): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

export async function runConsultationsPage(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  records: HubSpotConsultationRecord[],
  opts: { hasObjectIdColumn: boolean }
): Promise<PageStats> {
  const { hasObjectIdColumn } = opts;
  const out: PageStats = { inserted: 0, updated: 0, errors: [] };

  for (const r of records) {
    const p = r.properties;
    const objectId = r.id;

    try {
      // Email / name / phone come from EITHER the object's own
      // properties (custom-object case) OR the associated contact
      // (HubSpot Appointments don't carry these directly).
      const email = (p.email ?? r.contactEmail ?? "").trim();
      const fullName = (
        p.full_name ??
        p.fullname ??
        p.name ??
        p.title ??
        ""
      ).trim();
      const phone = (p.phone ?? "").trim();
      const dateOfBirth = (p.date_of_birth ?? p.dob ?? "").trim();
      const productSlug = (p.product_slug ?? "").trim();
      const dose = (p.dose ?? "").trim();

      // Status mapping prefers explicit consultation_status/status,
      // then falls back to the Appointments outcome / status fields.
      const rawStatus =
        p.consultation_status ??
        p.status ??
        p.hs_meeting_outcome ??
        p.hs_appointment_status;
      const status = mapConsultationStatus(rawStatus);

      // Answers: try a JSON `answers` property first; otherwise
      // build a minimal payload from the appointment metadata so
      // the consultation row carries SOMETHING useful.
      let answers: unknown;
      if (p.answers) {
        answers = parseAnswers(p.answers);
      } else if (p.hs_appointment_start || p.hs_appointment_name || p.notes) {
        answers = {
          appointment_name: p.hs_appointment_name ?? p.name ?? null,
          start: p.hs_appointment_start ?? null,
          end: p.hs_appointment_end ?? null,
          duration: p.hs_duration ?? null,
          notes: p.notes ?? null,
        };
      } else {
        answers = {};
      }
      const answersLiteral = esc(JSON.stringify(answers));

      let userId: number | null = null;
      if (email) {
        const userRes = await drizzle.execute(
          sql.raw(`SELECT id FROM "users" WHERE email = ${esc(email)} LIMIT 1;`)
        );
        const ur = readRows<{ id: number }>(userRes);
        if (ur[0]) userId = ur[0].id;
      }

      if (hasObjectIdColumn) {
        const updateStmt = `
          UPDATE "consultations"
          SET email          = COALESCE(${esc(email || null)}, email),
              full_name      = COALESCE(${esc(fullName || null)}, full_name),
              phone          = COALESCE(${esc(phone || null)}, phone),
              date_of_birth  = COALESCE(${esc(dateOfBirth || null)}, date_of_birth),
              product_slug   = COALESCE(${esc(productSlug || null)}, product_slug),
              dose           = COALESCE(${esc(dose || null)}, dose),
              answers        = ${answersLiteral}::jsonb,
              status         = ${esc(status)},
              user_id        = COALESCE(${escNum(userId)}, user_id),
              updated_at     = now()
          WHERE hubspot_object_id = ${esc(objectId)}
          RETURNING id;
        `;
        const updateRes = await drizzle.execute(sql.raw(updateStmt));
        if (readRows<{ id: number }>(updateRes).length > 0) {
          out.updated++;
          continue;
        }
      }

      const insertStmt = hasObjectIdColumn
        ? `
          INSERT INTO "consultations"
            (hubspot_object_id, email, full_name, phone, date_of_birth,
             product_slug, dose, answers, status, user_id,
             updated_at, created_at)
          VALUES
            (${esc(objectId)}, ${esc(email || null)}, ${esc(fullName || null)},
             ${esc(phone || null)}, ${esc(dateOfBirth || null)},
             ${esc(productSlug || null)}, ${esc(dose || null)},
             ${answersLiteral}::jsonb, ${esc(status)}, ${escNum(userId)},
             now(), now())
          RETURNING id;
        `
        : `
          INSERT INTO "consultations"
            (email, full_name, phone, date_of_birth,
             product_slug, dose, answers, status, user_id,
             updated_at, created_at)
          VALUES
            (${esc(email || null)}, ${esc(fullName || null)},
             ${esc(phone || null)}, ${esc(dateOfBirth || null)},
             ${esc(productSlug || null)}, ${esc(dose || null)},
             ${answersLiteral}::jsonb, ${esc(status)}, ${escNum(userId)},
             now(), now())
          RETURNING id;
        `;
      const insertRes = await drizzle.execute(sql.raw(insertStmt));
      if (readRows<{ id: number }>(insertRes).length > 0) out.inserted++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(
        `[hubspot:consultations] record ${objectId} failed:`,
        message
      );
      out.errors.push(`consultation ${objectId}: ${message}`);
    }
  }

  return out;
}
