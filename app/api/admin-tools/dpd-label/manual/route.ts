/**
 * DPD label without an order  —  /api/admin-tools/dpd-label/manual
 *
 * Admin-only (like the order label route). For parcels that aren't tied to
 * an order — a replacement, a resend, samples — staff type the recipient and
 * address and get a DPD label. Nothing about any order changes: no status,
 * no customer email, no HubSpot. Each label is logged in manual_dpd_labels
 * so it can be found, tracked and reprinted.
 *
 *   GET                                  → { ok, labels: [...] } (latest 100)
 *   POST { action: "create", ...fields } → { ok, labelHtml, trackingNumber, shipmentId }
 *   POST { action: "reprint", id }       → { ok, labelHtml, trackingNumber, shipmentId }
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";
import { UK_POSTCODE_RE, dpdAuth, dpdCreateShipment, dpdGetLabel } from "@/lib/dpd";

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

function rows<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";
const escOrNull = (s: string | null | undefined) => (s && s.trim() ? esc(s.trim()) : "NULL");

let tableReady: Promise<void> | null = null;
function ensureTable(drizzle: DrizzleLike, sql: SqlRaw): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await drizzle.execute(
        sql.raw(`
          CREATE TABLE IF NOT EXISTS "manual_dpd_labels" (
            "id" serial PRIMARY KEY NOT NULL,
            "recipient_name" varchar NOT NULL,
            "phone" varchar,
            "email" varchar,
            "address_line1" varchar NOT NULL,
            "address_line2" varchar,
            "town" varchar NOT NULL,
            "county" varchar,
            "postcode" varchar NOT NULL,
            "reference" varchar,
            "delivery_instructions" varchar,
            "weight_kg" numeric,
            "tracking_number" varchar NOT NULL,
            "shipment_id" bigint NOT NULL,
            "created_by" varchar,
            "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
          )
        `),
      );
    })().catch((e) => {
      tableReady = null; // retry next time
      throw e;
    });
  }
  return tableReady;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

const CreateSchema = z.object({
  action: z.literal("create"),
  name: z.string().trim().min(1, "Enter the recipient's name").max(35, "Name: 35 characters max"),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  addressLine1: z.string().trim().min(1, "Enter the first line of the address").max(35, "Address line 1: 35 characters max"),
  addressLine2: z.string().trim().max(35, "Address line 2: 35 characters max").optional().default(""),
  town: z.string().trim().min(1, "Enter the town or city").max(35, "Town: 35 characters max"),
  county: z.string().trim().max(35).optional().default(""),
  postcode: z.string().trim().min(1, "Enter the postcode"),
  reference: z.string().trim().max(25, "Reference: 25 characters max").optional().default(""),
  deliveryInstructions: z.string().trim().max(50, "Delivery instructions: 50 characters max").optional().default(""),
  weightKg: z.coerce.number().min(0.1, "Weight: at least 0.1 kg").max(30, "Weight: 30 kg max").optional(),
});

const ReprintSchema = z.object({ action: z.literal("reprint"), id: z.coerce.number().int().positive() });

type LabelRow = {
  id: number;
  recipient_name: string;
  phone: string | null;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  town: string;
  county: string | null;
  postcode: string;
  reference: string | null;
  delivery_instructions: string | null;
  weight_kg: string | number | null;
  tracking_number: string;
  shipment_id: string | number;
  created_by: string | null;
  created_at: string;
};

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  try {
    const { drizzle, sql } = await getDrizzle();
    await ensureTable(drizzle, sql);
    const list = rows<LabelRow>(
      await drizzle.execute(sql.raw(`SELECT * FROM "manual_dpd_labels" ORDER BY created_at DESC LIMIT 100`)),
    );
    return NextResponse.json({
      ok: true,
      labels: list.map((r) => ({
        id: r.id,
        name: r.recipient_name,
        phone: r.phone,
        email: r.email,
        address: [r.address_line1, r.address_line2, r.town, r.county, r.postcode].filter(Boolean).join(", "),
        reference: r.reference,
        weightKg: r.weight_kg === null ? null : Number(r.weight_kg),
        trackingNumber: r.tracking_number,
        shipmentId: Number(r.shipment_id),
        createdBy: r.created_by,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { drizzle, sql } = await getDrizzle();
  await ensureTable(drizzle, sql);

  /* Reprint: fetch the label for a shipment already made here. */
  const reprint = ReprintSchema.safeParse(body);
  if (reprint.success) {
    const found = rows<LabelRow>(
      await drizzle.execute(sql.raw(`SELECT * FROM "manual_dpd_labels" WHERE id = ${reprint.data.id} LIMIT 1`)),
    )[0];
    if (!found) return NextResponse.json({ ok: false, error: "Label not found" }, { status: 404 });
    try {
      const { session, account } = await dpdAuth();
      const labelHtml = await dpdGetLabel({ session, account, shipmentId: Number(found.shipment_id) });
      return NextResponse.json({
        ok: true,
        labelHtml,
        trackingNumber: found.tracking_number,
        shipmentId: Number(found.shipment_id),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[dpd-label/manual] reprint", msg);
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }
  }

  /* Create: a new DPD shipment for the typed-in recipient. */
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: first?.message ?? "Check the form" }, { status: 400 });
  }
  const f = parsed.data;
  const pc = f.postcode.match(UK_POSTCODE_RE);
  if (!pc || pc[0].replace(/\s+/g, "").length !== f.postcode.replace(/\s+/g, "").length) {
    return NextResponse.json({ ok: false, error: "Enter a valid UK postcode" }, { status: 400 });
  }
  const postcode = pc[1].toUpperCase().replace(/\s+/g, "").replace(/^(.+)(\d[A-Z]{2})$/, "$1 $2");
  const reference = f.reference || "JOOD-MANUAL";

  let labelHtml: string;
  let trackingNumber: string;
  let shipmentId: number;
  try {
    const { session, account } = await dpdAuth();
    const today = new Date().toISOString().split("T")[0] + "T00:00:00";
    const result = await dpdCreateShipment({
      session,
      account,
      orderNumber: reference,
      customerName: f.name,
      customerPhone: f.phone,
      address: {
        property: f.addressLine2,
        street: f.addressLine1,
        town: f.town,
        county: f.county,
        postcode,
        countryCode: "GB",
      },
      collectionDate: today,
      weightKg: f.weightKg,
      deliveryInstructions: f.deliveryInstructions,
    });
    shipmentId = result.shipmentId;
    trackingNumber = result.trackingNumber;
    labelHtml = await dpdGetLabel({ session, account, shipmentId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[dpd-label/manual]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  // Log it. The DPD shipment already exists at this point, so a logging
  // failure must not hide the label from the user.
  try {
    await drizzle.execute(
      sql.raw(`
        INSERT INTO "manual_dpd_labels"
          (recipient_name, phone, email, address_line1, address_line2, town, county, postcode,
           reference, delivery_instructions, weight_kg, tracking_number, shipment_id, created_by)
        VALUES (${esc(f.name)}, ${escOrNull(f.phone)}, ${escOrNull(f.email)}, ${esc(f.addressLine1)},
                ${escOrNull(f.addressLine2)}, ${esc(f.town)}, ${escOrNull(f.county)}, ${esc(postcode)},
                ${escOrNull(f.reference)}, ${escOrNull(f.deliveryInstructions)},
                ${f.weightKg ? Number(f.weightKg) : "NULL"}, ${esc(trackingNumber)}, ${Number(shipmentId)},
                ${escOrNull(user.email)})
      `),
    );
  } catch (err) {
    console.warn("[dpd-label/manual] label made but not logged:", err);
  }

  return NextResponse.json({ ok: true, labelHtml, trackingNumber, shipmentId });
}
