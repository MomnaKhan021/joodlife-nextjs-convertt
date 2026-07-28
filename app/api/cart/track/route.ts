/**
 * POST /api/cart/track
 *
 * Public endpoint. Captures a shopper's in-progress cart for abandoned-checkout
 * recovery. Called from the checkout page once we know the customer's email and
 * they have items in the basket. Upserted by email — one live row per shopper.
 * When they complete checkout, /api/checkout stamps recovered_at so the row
 * drops out of the Abandoned Checkout queue.
 *
 * Body: { email, name?, phone?, total?, items: [{slug,title,dose,price,quantity}] }
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

function esc(s: string): string {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function rowsOf(r: unknown): unknown[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: unknown[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  const name = String(body.name ?? "").slice(0, 200);
  const phone = String(body.phone ?? "").slice(0, 40);
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ ok: false, error: "No items" }, { status: 400 });
  }
  const items = rawItems.map((raw) => {
    const i = raw as Record<string, unknown>;
    return {
      slug: String(i.slug ?? "").slice(0, 120),
      title: String(i.title ?? "").slice(0, 200),
      dose: i.dose ? String(i.dose).slice(0, 60) : null,
      price: Number(i.price) || 0,
      quantity: Math.max(1, Math.min(99, Number(i.quantity) || 1)),
    };
  });
  const total = Number(body.total) || 0;
  const itemsJson = JSON.stringify(items);

  try {
    const { drizzle, sql } = await getDrizzle();
    // Manual upsert (the unique index is on LOWER(email)): update the live row
    // and clear any prior recovered flag; insert if there isn't one yet.
    const upd = await drizzle.execute(
      sql.raw(`
        UPDATE "abandoned_carts"
           SET customer_name = ${esc(name)},
               phone = ${esc(phone)},
               items_json = ${esc(itemsJson)}::jsonb,
               total_amount = ${total},
               source = 'checkout',
               recovered_at = NULL,
               updated_at = now()
         WHERE LOWER(email) = ${esc(email)}
         RETURNING id
      `),
    );
    if (rowsOf(upd).length === 0) {
      await drizzle.execute(
        sql.raw(`
          INSERT INTO "abandoned_carts"
            (email, customer_name, phone, items_json, total_amount, source, updated_at, created_at)
          VALUES
            (${esc(email)}, ${esc(name)}, ${esc(phone)}, ${esc(itemsJson)}::jsonb, ${total}, 'checkout', now(), now())
        `),
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
