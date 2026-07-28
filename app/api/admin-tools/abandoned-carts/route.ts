/**
 * Abandoned Checkout admin API.
 *
 *   GET  ?count=1   → { ok, count }        (non-recovered carts — sidebar badge)
 *   GET             → { ok, items }        (list for the Abandoned Checkout view)
 *   POST { id, action:"remind" }           → send a reminder email now
 *   POST { id, action:"dismiss" }          → drop the cart from the queue
 *
 * Admin/staff only.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { sendAbandonedCartEmail } from "@/lib/account-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function ctx() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { payload, user, drizzle: drizzle as DrizzleLike, sql };
}

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

export async function GET(req: NextRequest) {
  const { user, drizzle, sql } = await ctx();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  try {
    if (req.nextUrl.searchParams.get("count") === "1") {
      const r = await drizzle.execute(
        sql.raw(`SELECT COUNT(*)::int AS n FROM "abandoned_carts" WHERE recovered_at IS NULL`),
      );
      return NextResponse.json({ ok: true, count: rowsOf<{ n: number }>(r)[0]?.n ?? 0 });
    }
    const r = await drizzle.execute(
      sql.raw(`
        SELECT id, email, customer_name, phone, items_json, total_amount,
               reminder_count, last_reminded_at, created_at, updated_at
          FROM "abandoned_carts"
         WHERE recovered_at IS NULL
         ORDER BY updated_at DESC NULLS LAST, id DESC
         LIMIT 500
      `),
    );
    return NextResponse.json({ ok: true, items: rowsOf(r) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { payload, user, drizzle, sql } = await ctx();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  let body: { id?: number; action?: string };
  try {
    body = (await req.json()) as { id?: number; action?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const id = Number(body.id);
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  try {
    if (body.action === "dismiss") {
      await drizzle.execute(
        sql.raw(`UPDATE "abandoned_carts" SET recovered_at = now(), updated_at = now() WHERE id = ${id}`),
      );
      return NextResponse.json({ ok: true });
    }

    // Default: send a reminder now.
    const r = await drizzle.execute(
      sql.raw(
        `SELECT email, customer_name, phone, items_json, total_amount FROM "abandoned_carts" WHERE id = ${id} AND recovered_at IS NULL LIMIT 1`,
      ),
    );
    const cart = rowsOf<{
      email: string;
      customer_name: string | null;
      phone: string | null;
      items_json: Array<{ title?: string; dose?: string | null; quantity?: number }> | null;
      total_amount: number | null;
    }>(r)[0];
    if (!cart) return NextResponse.json({ ok: false, error: "Cart not found" }, { status: 404 });

    await sendAbandonedCartEmail(payload, {
      email: cart.email,
      name: cart.customer_name,
      items: cart.items_json ?? [],
      total: cart.total_amount,
      whatsapp: cart.phone,
    });
    await drizzle.execute(
      sql.raw(
        `UPDATE "abandoned_carts" SET reminder_count = COALESCE(reminder_count,0) + 1, last_reminded_at = now(), updated_at = now() WHERE id = ${id}`,
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
