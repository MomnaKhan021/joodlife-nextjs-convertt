/**
 * POST /api/checkout
 *
 * Creates an order from the storefront cart. Testing-phase flow —
 * NO payment is taken; the row is inserted with paymentMethod="test"
 * and status="pending" so admin can review and progress it manually.
 *
 * Body (JSON):
 *   {
 *     items: [{ productId, slug, title, dose, price, quantity, imageUrl? }],
 *     customer: {
 *       name, email, phone, address, notes?
 *     }
 *   }
 *
 * Returns: { ok: true, id, orderNumber, totalAmount }
 *
 * Goes via raw SQL through Payload's Drizzle escape hatch (same
 * pattern lib/products.ts uses) so we don't have to fight Payload's
 * upload/relation pipelines for the orders array.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CartItem = {
  productId: number;
  slug: string;
  title: string;
  dose: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type Body = {
  items?: CartItem[];
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  };
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Cart is empty" },
      { status: 400 }
    );
  }
  const c = body.customer ?? {};
  if (!c.name?.trim() || !c.email?.trim() || !c.address?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing required customer fields (name, email, address)" },
      { status: 400 }
    );
  }

  // Server-trusted total — never trust the client's number.
  const totalAmount = items.reduce(
    (acc, i) => acc + Number(i.price || 0) * Math.max(1, Number(i.quantity || 1)),
    0
  );
  const totalRounded = Math.round(totalAmount * 100) / 100;

  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 }
    );
  }

  // If logged in, attach the user
  let userId: number | null = null;
  try {
    const { user } = await payload.auth({ headers: await nextHeaders() });
    if (user) userId = Number((user as unknown as { id: number | string }).id);
  } catch {
    // anonymous fine
  }

  // Random short order number, e.g. JL-MA9X7
  const orderNumber = `JL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  try {
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) {
      throw new Error("payload.db.drizzle.execute unavailable");
    }
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const esc = (s: string | null | undefined) =>
      s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";

    const stmt = `
      INSERT INTO "orders"
        (order_number, user_id, customer_name, customer_email, customer_phone,
         shipping_address, items_json, total_amount, discount_amount,
         status, payment_method, notes, updated_at, created_at)
      VALUES
        (${esc(orderNumber)}, ${userId ?? "NULL"},
         ${esc(c.name)}, ${esc(c.email)}, ${esc(c.phone)},
         ${esc(c.address)},
         ${esc(JSON.stringify(items))}::jsonb,
         ${totalRounded}, 0,
         'pending', 'test',
         ${esc(c.notes)},
         now(), now())
      RETURNING id;
    `;
    const result = (await drizzle.execute(drizzleSql.raw(stmt))) as
      | { rows?: Array<{ id: number }> }
      | Array<{ id: number }>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    const id = rows[0]?.id ?? null;

    return NextResponse.json({
      ok: true,
      id,
      orderNumber,
      totalAmount: totalRounded,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Order insert failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout?orderNumber=JL-XYZ
 * Public — used by the success page to display the order confirmation.
 * Returns only the safe summary fields; the full row stays in admin.
 */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber) {
    return NextResponse.json(
      { ok: false, error: "Missing ?orderNumber" },
      { status: 400 }
    );
  }

  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 }
    );
  }

  try {
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) {
      throw new Error("payload.db.drizzle.execute unavailable");
    }
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const safeNumber = orderNumber.replace(/'/g, "''");
    const result = (await drizzle.execute(
      drizzleSql.raw(
        `SELECT order_number, customer_name, customer_email, items_json,
                total_amount, status, created_at
         FROM "orders"
         WHERE order_number = '${safeNumber}'
         LIMIT 1`
      )
    )) as
      | { rows?: Array<Record<string, unknown>> }
      | Array<Record<string, unknown>>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const r = rows[0];
    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        items: r.items_json ?? [],
        totalAmount: Number(r.total_amount),
        status: r.status,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Read failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
