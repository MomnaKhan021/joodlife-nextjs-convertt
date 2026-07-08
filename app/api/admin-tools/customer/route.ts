/**
 * GET /api/admin-tools/customer?email=<email>
 *
 * Customer detail for the admin customer page: the user's profile plus their
 * full order history and aggregates (total orders, total spent, cancellations,
 * and how many of each product they've bought — e.g. "2× Mounjaro").
 *
 * Keyed by email because that's what orders carry (customer_email); the users
 * table is joined for the name/phone/join date when an account exists.
 *
 * Admin/staff only.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

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

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

async function authorize() {
  try {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: await nextHeaders() });
    const role = (user as unknown as { role?: string } | null)?.role;
    if (!user || (role !== "admin" && role !== "staff")) return null;
    return user;
  } catch {
    return null;
  }
}

type Item = { title: string | null; dose: string | null; quantity: number };

/** Parse an order's items_json (array / JSON string / summary) into items. */
function parseItems(raw: unknown): Item[] {
  let val: unknown = raw;
  if (typeof raw === "string") {
    try {
      val = JSON.parse(raw);
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const m = s.match(/^(.*?)(?:\s*\(([^)]*)\))?\s*[x×]\s*(\d+)\s*$/i);
          return m
            ? { title: m[1].trim(), dose: (m[2] ?? "").trim() || null, quantity: Number(m[3]) || 1 }
            : { title: s, dose: null, quantity: 1 };
        });
    }
  }
  const arr = Array.isArray(val) ? val : val && typeof val === "object" ? [val] : [];
  const out: Item[] = [];
  for (const el of arr) {
    if (!el || typeof el !== "object") continue;
    const it = el as Record<string, unknown>;
    const title = String(it.title ?? it.name ?? it.product ?? "").trim();
    if (!title) continue;
    out.push({
      title,
      dose: (typeof it.dose === "string" && it.dose) || (typeof it.variant === "string" && it.variant) || null,
      quantity: Number(it.quantity ?? it.qty ?? 1) || 1,
    });
  }
  return out;
}

type OrderRow = {
  id: number;
  order_number: string | null;
  customer_name: string | null;
  status: string | null;
  payment_status: string | null;
  total_amount: string | number | null;
  items_json: unknown;
  created_at: string | null;
};

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
};

export async function GET(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Admin or staff role required" }, { status: 403 });
  }

  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }
  const esc = email.replace(/'/g, "''");

  try {
    const { drizzle, sql } = await getDrizzle();

    const [ordersRes, userRes] = await Promise.all([
      drizzle.execute(
        sql.raw(`
          SELECT id, order_number, customer_name, status, payment_status, total_amount, items_json, created_at
          FROM orders
          WHERE LOWER(customer_email) = '${esc}'
          ORDER BY created_at DESC NULLS LAST, id DESC
          LIMIT 500
        `),
      ),
      drizzle.execute(
        sql.raw(`
          SELECT id, name, email, phone, created_at
          FROM users
          WHERE LOWER(email) = '${esc}'
          ORDER BY id ASC
          LIMIT 1
        `),
      ),
    ]);

    const orderRows = rowsOf<OrderRow>(ordersRes);
    const account = rowsOf<UserRow>(userRes)[0] ?? null;

    // Name: prefer the account, else the most recent order's customer name.
    const name =
      account?.name ??
      orderRows.find((o) => (o.customer_name ?? "").trim())?.customer_name ??
      null;

    let totalSpent = 0;
    let cancellations = 0;
    let refunds = 0;
    const productCounts: Record<string, number> = {};
    const orders = orderRows.map((o) => {
      const status = String(o.status ?? "").toLowerCase();
      const payment = String(o.payment_status ?? "").toLowerCase();
      const total = Number(o.total_amount ?? 0) || 0;
      if (status === "cancelled") cancellations += 1;
      if (status === "refunded" || payment === "refunded") refunds += 1;
      if (payment === "paid" || status === "paid") totalSpent += total;
      const items = parseItems(o.items_json);
      for (const it of items) {
        const key = it.title ?? "Item";
        productCounts[key] = (productCounts[key] ?? 0) + (it.quantity || 1);
      }
      return {
        id: o.id,
        orderNumber: o.order_number,
        status,
        paymentStatus: payment,
        total,
        createdAt: o.created_at,
        items,
      };
    });

    return NextResponse.json({
      ok: true,
      customer: {
        email,
        name,
        phone: account?.phone ?? null,
        joinedAt: account?.created_at ?? null,
        hasAccount: Boolean(account),
      },
      stats: {
        totalOrders: orders.length,
        totalSpent,
        cancellations,
        refunds,
        productCounts,
      },
      orders,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Customer lookup failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
