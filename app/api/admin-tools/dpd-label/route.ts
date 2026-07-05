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
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";

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
/* Address parsing                                                     */
/* ------------------------------------------------------------------ */
const UK_POSTCODE_RE = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/i;

type ParsedAddress = {
  property: string;
  street: string;
  town: string;
  county: string;
  postcode: string;
  countryCode: string;
};

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

function parseShippingAddress(raw: string): ParsedAddress {
  // Split on comma or newline; trim each part
  const parts = raw
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Extract postcode
  let postcode = "";
  const filteredParts: string[] = [];
  for (const part of parts) {
    const m = part.match(UK_POSTCODE_RE);
    if (m && !postcode) {
      postcode = m[1].toUpperCase().replace(/\s+/, " ");
      // Remove only the postcode portion from this part; keep the rest
      const remainder = part.replace(UK_POSTCODE_RE, "").trim();
      if (remainder) filteredParts.push(remainder);
    } else {
      // Drop obvious country labels
      const lower = part.toLowerCase();
      if (["united kingdom", "uk", "england", "scotland", "wales", "great britain"].includes(lower)) continue;
      filteredParts.push(part);
    }
  }

  // Map remaining parts to address fields
  // UK address lines: [name?, property?, street, locality?, town, county?]
  // We already stripped the customer name at a higher level, so here parts are address only.
  const property = filteredParts.length > 2 ? filteredParts[1] : "";
  const street = filteredParts[0] ?? "";
  const town = filteredParts[filteredParts.length - 1] ?? "";
  const county = filteredParts.length >= 3 ? filteredParts[filteredParts.length - 2] : "";

  return {
    property,
    street,
    town,
    county: county === town ? "" : county,
    postcode: postcode || "EC1A 1BB",
    countryCode: "GB",
  };
}

/* ------------------------------------------------------------------ */
/* DPD REST API helpers                                                */
/* ------------------------------------------------------------------ */
const DPD_BASE = process.env.DPD_API_BASE ?? "https://api.dpdlocal.co.uk";

type DpdAuthResponse = {
  data?: {
    geoSession?: string;
    geoUser?: { geoAccount?: string };
  };
  error?: { errorMessage?: string };
};

type DpdShipmentResponse = {
  data?: {
    shipmentId?: number;
    consignmentDetail?: Array<{
      consignmentNumber?: string;
      parcelNumbers?: string[];
    }>;
  };
  error?: { errorMessage?: string };
};

async function dpdAuth(): Promise<{ session: string; account: string }> {
  const user = process.env.DPD_API_USER ?? "";
  const pass = process.env.DPD_API_PASS ?? "";
  if (!user || !pass) throw new Error("DPD_API_USER / DPD_API_PASS environment variables not set");

  const credentials = Buffer.from(`${user}:${pass}`).toString("base64");
  const res = await fetch(`${DPD_BASE}/user/?action=login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DPD auth failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  const json: DpdAuthResponse = await res.json();
  const session = json?.data?.geoSession;
  const account = json?.data?.geoUser?.geoAccount ?? process.env.DPD_ACCOUNT_NO ?? user;
  if (!session) throw new Error("DPD auth: no geoSession in response");
  return { session, account };
}

async function dpdCreateShipment(opts: {
  session: string;
  account: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: ParsedAddress;
  collectionDate: string; // ISO date string
}): Promise<{ shipmentId: number; trackingNumber: string }> {
  const senderName = process.env.DPD_SENDER_NAME ?? "Jood Life";
  const senderStreet = process.env.DPD_SENDER_STREET ?? "1 Sender Street";
  const senderTown = process.env.DPD_SENDER_TOWN ?? "London";
  const senderPostcode = process.env.DPD_SENDER_POSTCODE ?? "EC1A 1BB";
  const networkCode = process.env.DPD_NETWORK_CODE ?? "1^12";
  const weight = parseFloat(process.env.DPD_PARCEL_WEIGHT_KG ?? "0.5");

  const body = {
    jobId: null,
    collectionOnDelivery: false,
    invoice: null,
    collectionDate: opts.collectionDate,
    consolidate: false,
    consignment: [
      {
        consignmentNumber: null,
        consignmentRef: null,
        parcel: [{ weight }],
        collectionDetails: {
          contactDetails: {
            contactName: senderName,
          },
          address: {
            organisation: senderName,
            countryCode: "GB",
            postcode: senderPostcode,
            street: senderStreet,
            localityName: "",
            town: senderTown,
            county: "",
          },
        },
        deliveryDetails: {
          contactDetails: {
            contactName: opts.customerName || "Customer",
            telephone: opts.customerPhone || "",
          },
          address: {
            organisation: "",
            countryCode: opts.address.countryCode,
            postcode: opts.address.postcode,
            property: opts.address.property,
            street: opts.address.street,
            localityName: "",
            town: opts.address.town,
            county: opts.address.county,
          },
          notificationDetails: {},
        },
        networkCode,
        numberOfParcels: 1,
        totalWeight: weight,
        shippingRef1: opts.orderNumber,
        shippingRef2: "",
        shippingRef3: "",
        customsValue: null,
        deliveryInstructions: "",
        parcelDescription: "",
        liabilityValue: null,
        liability: false,
      },
    ],
  };

  const res = await fetch(`${DPD_BASE}/shipping/shipment`, {
    method: "POST",
    headers: {
      GeoClient: `account/${opts.account}`,
      GeoSession: opts.session,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DPD create shipment failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  const json: DpdShipmentResponse = await res.json();
  if (json?.error?.errorMessage) throw new Error(`DPD error: ${json.error.errorMessage}`);

  const shipmentId = json?.data?.shipmentId;
  if (!shipmentId) throw new Error("DPD: no shipmentId in response");

  const detail = json?.data?.consignmentDetail?.[0];
  const trackingNumber =
    detail?.parcelNumbers?.[0] ?? detail?.consignmentNumber ?? String(shipmentId);

  return { shipmentId, trackingNumber };
}

async function dpdGetLabel(opts: {
  session: string;
  account: string;
  shipmentId: number;
}): Promise<string> {
  // DPD Local returns the label as HTML (for A4 laser). CLP/EPL are the only
  // other options; there is no PDF endpoint in the DPD Local spec.
  const res = await fetch(
    `${DPD_BASE}/shipping/shipment/${opts.shipmentId}/label/`,
    {
      method: "GET",
      headers: {
        GeoClient: `account/${opts.account}`,
        GeoSession: opts.session,
        Accept: "text/html",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DPD get label failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  return res.text();
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
    customer_phone: string | null;
    shipping_address: string | null;
    notes: string | null;
    status: string | null;
    total_amount: string | number | null;
  };

  const orderResult = await drizzle.execute(
    sql.raw(`SELECT id, order_number, customer_name, customer_phone, shipping_address, notes, status, total_amount FROM orders WHERE id = ${orderId} LIMIT 1`),
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
  const orderTotal = Number(order.total_amount ?? 0) || 0;
  if (orderTotal <= 0) {
    return NextResponse.json(
      { ok: false, error: "Order total is £0 — cannot print a dispatch label" },
      { status: 409 },
    );
  }

  /* 4. Resolve the delivery address.
   *    The label always ships to the address the customer entered. Checkout
   *    stores the delivery address (or the single address, when the customer
   *    didn't add a separate one) in shipping_address. For older/edge orders
   *    where that column is empty, fall back to the "Billing/contact address"
   *    block kept in notes, so we still dispatch to the address on record. */
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
        `UPDATE orders SET notes = ${esc(updatedNotes)}, status = 'shipped' WHERE id = ${orderId}`,
      ),
    );
  } catch (err) {
    // Non-fatal — label was generated; just log
    console.warn("[dpd-label] Failed to update order notes:", err);
  }

  return NextResponse.json({
    ok: true,
    labelHtml,
    trackingNumber,
    shipmentId,
  });
}
