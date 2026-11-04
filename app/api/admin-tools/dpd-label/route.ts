/**
 * DPD Dispatch Label  —  POST /api/admin-tools/dpd-label
 *
 * Admin-only.  Given an orderId, this handler:
 *   1. Authenticates with the DPD UK REST API.
 *   2. Creates a shipment using the order's shipping address & details.
 *   3. Fetches the A4 PDF label from DPD.
 *   4. Saves the tracking number back to the order's notes column.
 *   5. Returns { ok, labelBase64, trackingNumber, shipmentId }
 *      so the client can open the PDF blob in a new tab for printing.
 *
 * Required env vars:
 *   DPD_API_USER      — DPD account username (e.g. "12345678")
 *   DPD_API_PASS      — DPD API password / token
 *   DPD_ACCOUNT_NO    — DPD geo-account number (same as DPD_API_USER usually)
 *
 * Optional:
 *   DPD_SENDER_NAME         — defaults to "Jood Life"
 *   DPD_SENDER_STREET       — sender street address
 *   DPD_SENDER_TOWN         — sender town
 *   DPD_SENDER_POSTCODE     — sender postcode  (defaults to "EC1A 1BB")
 *   DPD_NETWORK_CODE        — service code     (defaults to "1^12" = Next Day)
 *   DPD_PARCEL_WEIGHT_KG    — default parcel weight in kg (defaults to "0.5")
 *
 *   DPD_API_BASE            — API host (defaults to "https://api.dpdlocal.co.uk")
 *
 * DPD Local REST API base: https://api.dpdlocal.co.uk
 */
import { NextResponse, after, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";
import { dpdAuth, dpdCreateShipment, dpdGetLabel, parseShippingAddress } from "@/lib/dpd";
import { sendDispatchedEmail } from "@/lib/account-email";
import {
  fireHubSpot,
  findDealsByContactEmail,
  updateDealStage,
  PATIENT_LIFECYCLE_STAGES,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* DB helpers (same pattern as /api/admin-tools/record)                */
/* ------------------------------------------------------------------ */
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

function rows<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";

/* ------------------------------------------------------------------ */
/* Address resolution (order-specific)                                 */
/* ------------------------------------------------------------------ */
/**
 * Returns the raw address string to ship to. Prefers the order's
 * shipping_address; if that is empty, extracts the "Billing/contact address"
 * block that checkout stores in notes so we still dispatch to the address the
 * customer provided. Returns null only when no usable address exists anywhere.
 */
function resolveDeliveryAddress(
  shippingAddress: string | null,
  notes: string | null,
): string | null {
  const primary = (shippingAddress ?? "").trim();
  if (primary && primary !== "—") return primary;

  const raw = (notes ?? "").trim();
  if (!raw) return null;
  // notes format: "Billing/contact address:\n<line1>\n<line2>\n..."
  const marker = raw.toLowerCase().indexOf("address:");
  const block = marker >= 0 ? raw.slice(marker + "address:".length) : raw;
  const cleaned = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().startsWith("dpd tracking"))
    .join("\n")
    .trim();
  return cleaned || null;
}

/* ------------------------------------------------------------------ */
/* Route handler                                                       */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  /* 1. Auth guard */
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  /* 2. Parse request body */
  let orderId: number;
  try {
    const body = await req.json();
    orderId = Number(body.orderId);
    if (!orderId || !Number.isFinite(orderId)) throw new Error("invalid orderId");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  /* 3. Fetch order from DB */
  const { drizzle, sql } = await getDrizzle();
  type OrderRow = {
    id: number;
    order_number: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    shipping_address: string | null;
    dispatch_note?: string | null;
    notes: string | null;
    status: string | null;
    total_amount: string | number | null;
    items_json: unknown;
    hubspot_deal_id: string | null;
  };

  const orderResult = await drizzle.execute(
    sql.raw(`SELECT id, order_number, customer_name, customer_email, customer_phone, shipping_address, notes, status, total_amount, items_json, hubspot_deal_id, to_jsonb(orders) ->> 'dispatch_note' AS dispatch_note FROM orders WHERE id = ${orderId} LIMIT 1`),
  );
  const orderRows = rows<OrderRow>(orderResult);
  if (!orderRows.length) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  const order = orderRows[0];

  /* 3a. Guard order state — no label for cancelled or zero-value orders. */
  const orderStatus = (order.status ?? "").toLowerCase();
  if (orderStatus === "cancelled") {
    return NextResponse.json(
      { ok: false, error: "Order is cancelled — cannot print a dispatch label" },
      { status: 409 },
    );
  }
  // Free/test orders legitimately have total_amount = 0 but still hold real
  // products that must be shipped. Fall back to the line-item value so only a
  // genuinely empty order (nothing to ship) is blocked.
  const orderTotal = Number(order.total_amount ?? 0) || 0;
  const itemsValue = (() => {
    const raw = order.items_json;
    let arr: unknown = raw;
    if (typeof raw === "string") {
      try {
        arr = JSON.parse(raw);
      } catch {
        return 0;
      }
    }
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum: number, it) => {
      if (it && typeof it === "object") {
        const o = it as Record<string, unknown>;
        const price = Number(o.price) || 0;
        const qty = Number(o.quantity ?? o.qty ?? 1) || 1;
        return sum + price * qty;
      }
      return sum;
    }, 0);
  })();
  const orderValue = orderTotal > 0 ? orderTotal : itemsValue;
  if (orderValue <= 0) {
    return NextResponse.json(
      { ok: false, error: "Order has no items to ship — cannot print a dispatch label" },
      { status: 409 },
    );
  }

  /* 4. Resolve the delivery address.
   *    The label always ships to the address the customer entered. Checkout
   *    stores the delivery address (or the single address, when the customer
   *    didn't add a separate one) in shipping_address. For older/edge orders
   *    where that column is empty, fall back to the "Billing/contact address"
   *    block kept in notes, so we still dispatch to the address on record. */
  // NOTE: no dispatch-note gate here. The note now lives as the CLINICAL note
  // captured in Clinical Check, and the per-order dispatch-note field was
  // removed from the To Dispatch card — so requiring orders.dispatch_note here
  // left staff unable to print the label with no field to satisfy it.

  const shipTo = resolveDeliveryAddress(order.shipping_address, order.notes);
  if (!shipTo) {
    return NextResponse.json(
      { ok: false, error: "Order has no delivery address on record" },
      { status: 422 },
    );
  }
  const address = parseShippingAddress(shipTo);

  /* 5. Call DPD API */
  let labelHtml: string;
  let trackingNumber: string;
  let shipmentId: number;

  try {
    /* 5a. Authenticate */
    const { session, account } = await dpdAuth();

    /* 5b. Create shipment — collection date = today (DPD needs ISO date) */
    const today = new Date().toISOString().split("T")[0] + "T00:00:00";
    const result = await dpdCreateShipment({
      session,
      account,
      orderNumber: order.order_number,
      customerName: order.customer_name ?? "Customer",
      customerPhone: order.customer_phone ?? "",
      address,
      collectionDate: today,
    });
    shipmentId = result.shipmentId;
    trackingNumber = result.trackingNumber;

    /* 5c. Fetch label HTML */
    labelHtml = await dpdGetLabel({ session, account, shipmentId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[dpd-label]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  /* 6. Append tracking info to order notes */
  const existingNotes = order.notes ?? "";
  const trackingLine = `DPD tracking: ${trackingNumber} (shipment #${shipmentId})`;
  const updatedNotes = existingNotes
    ? existingNotes.includes("DPD tracking")
      ? existingNotes // already has tracking — don't duplicate
      : `${existingNotes}\n${trackingLine}`
    : trackingLine;

  try {
    await drizzle.execute(
      sql.raw(
        `UPDATE orders SET notes = ${esc(updatedNotes)}, status = 'shipped', updated_at = now() WHERE id = ${orderId}`,
      ),
    );
  } catch (err) {
    // Non-fatal — label was generated; just log
    console.warn("[dpd-label] Failed to update order notes:", err);
  }

  // Mirror to HubSpot: move the patient's deal to the "Dispatched" stage in
  // the Patient Order Lifecycle pipeline. Fire-and-forget — a HubSpot hiccup
  // must never fail the dispatch (the label is already made).
  const dealId = (order.hubspot_deal_id ?? "").trim();
  const email = (order.customer_email ?? "").trim();
  if (dealId || email) {
    after(async () => {
      await fireHubSpot("dispatch:deal-stage", async () => {
        let targetDealId = dealId;
        if (!targetDealId && email) {
          const deals = await findDealsByContactEmail(email);
          if (deals.ok && deals.data.length > 0) targetDealId = deals.data[0].id;
        }
        if (!targetDealId) return { ok: true as const, data: { id: "" } };
        return updateDealStage(targetDealId, PATIENT_LIFECYCLE_STAGES.dispatched, {
          jood_tracking_number: trackingNumber,
        });
      });
    });
  }

  // Dispatch confirmation email — "Your order is on its way", with the DPD
  // tracking link. Sent once per order (claimed atomically so a re-print of the
  // label never re-sends), fire-and-forget AFTER the response so it can never
  // slow or fail the dispatch itself.
  if (email) {
    const custName = (order.customer_name ?? "").trim() || null;
    const orderNumber = order.order_number ?? null;
    const trackingUrl = `https://track.dpd.co.uk/parcels/${encodeURIComponent(trackingNumber)}`;
    after(async () => {
      try {
        await drizzle.execute(
          sql.raw(
            `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS dispatch_email_sent boolean,
                                  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz`,
          ),
        );
        // dispatched_at feeds the delivery-day "how to use your pen" email
        // (/api/cron/treatment-guides), which goes out the day after dispatch.
        const claim = rows<{ id: number }>(
          await drizzle.execute(
            sql.raw(
              `UPDATE "orders" SET dispatch_email_sent = true, dispatched_at = COALESCE(dispatched_at, now())
                 WHERE id = ${orderId} AND COALESCE(dispatch_email_sent, false) = false
                 RETURNING id`,
            ),
          ),
        );
        if (claim.length === 0) return; // already sent for this order
        const payload = await getPayloadInstance();
        await sendDispatchedEmail(payload, { email, name: custName, orderNumber, trackingUrl });
      } catch (e) {
        console.error("[dpd-label] dispatch email failed", e);
      }
    });
  }

  return NextResponse.json({
    ok: true,
    labelHtml,
    trackingNumber,
    shipmentId,
  });
}
