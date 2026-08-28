/**
 * Abandoned Checkout admin API.
 *
 * Combines two kinds of "didn't complete a purchase" leads:
 *   - kind "cart"         → an unfinished basket captured by /api/cart/track
 *   - kind "consultation" → someone who filled a consultation but has no order
 *
 *   GET  ?count=1                          → { ok, count }  (sidebar badge)
 *   GET                                    → { ok, items }  (merged list)
 *   POST { id, kind, action:"remind" }     → send a reminder email now
 *   POST { id, kind, action:"dismiss" }    → drop the lead from the queue
 *
 * Both kinds respect the legacy-data hide (lib/adminHide.ts), so only new
 * leads surface during the fresh-start period. Admin/staff only.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { sendAbandonedCartEmail } from "@/lib/account-email";
import { hideBeforeSql } from "@/lib/adminHide";

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

/** Consultation with a submitted/reviewed status, an email, no matching order,
 *  not dismissed, and (during fresh-start) created after the hide cutoff. */
function consultWhere(): string {
  const hc = hideBeforeSql("created_at");
  // Must mirror Clinical Check, which only accepts a PAID order. Counting any
  // order row meant a customer whose card was declined had an (unpaid) order,
  // so they were excluded here AND excluded from Clinical Check — falling
  // through both queues. A declined or abandoned payment belongs here.
  // Scoped past the legacy-data cutoff — must stay the exact mirror of
  // Clinical Check's paidOrderExists, or patients fall through both queues.
  const orderHide = hideBeforeSql("o.created_at");
  const orderExists = `EXISTS (SELECT 1 FROM "orders" o WHERE LOWER(o.customer_email) = LOWER("consultations".email) AND LOWER(COALESCE(o.payment_status::text, '')) = 'paid' AND (COALESCE(o.total_amount, 0) > 0 OR COALESCE(CAST(o.notes AS TEXT),'') ILIKE '%Card verified%')${orderHide ? ` AND ${orderHide}` : ""})`;
  return `status IN ('submitted','reviewed')
     AND email IS NOT NULL AND email <> ''
     AND NOT ${orderExists}
     AND (answers->>'_abandoned_dismissed') IS NULL
     ${hc ? `AND ${hc}` : ""}`;
}

export async function GET(req: NextRequest) {
  const { user, drizzle, sql } = await ctx();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  const cartHide = hideBeforeSql("created_at");
  const cartWhere = `recovered_at IS NULL${cartHide ? ` AND ${cartHide}` : ""}`;

  try {
    if (req.nextUrl.searchParams.get("count") === "1") {
      const [c1, c2] = await Promise.all([
        drizzle.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "abandoned_carts" WHERE ${cartWhere}`)),
        drizzle.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "consultations" WHERE ${consultWhere()}`)),
      ]);
      const total =
        (rowsOf<{ n: number }>(c1)[0]?.n ?? 0) + (rowsOf<{ n: number }>(c2)[0]?.n ?? 0);
      return NextResponse.json({ ok: true, count: total });
    }

    const [cartRes, consultRes] = await Promise.all([
      drizzle.execute(
        sql.raw(`
          SELECT id, email, customer_name, phone, items_json, total_amount,
                 reminder_count, last_reminded_at, created_at
            FROM "abandoned_carts"
           WHERE ${cartWhere}
           ORDER BY updated_at DESC NULLS LAST, id DESC
           LIMIT 500
        `),
      ),
      drizzle.execute(
        sql.raw(`
          SELECT id, email, full_name AS customer_name, phone, product_slug,
                 (answers->>'_cart_reminder_count') AS reminder_count,
                 (answers->>'_cart_reminded_at') AS last_reminded_at,
                 created_at
            FROM "consultations"
           WHERE ${consultWhere()}
           ORDER BY updated_at DESC NULLS LAST, id DESC
           LIMIT 500
        `),
      ),
    ]);

    type CartRow = {
      id: number; email: string; customer_name: string | null; phone: string | null;
      items_json: Array<{ title?: string; dose?: string | null; quantity?: number }> | null;
      total_amount: number | null; reminder_count: number | null;
      last_reminded_at: string | null; created_at: string | null;
    };
    type ConsultRow = {
      id: number; email: string; customer_name: string | null; phone: string | null;
      product_slug: string | null; reminder_count: string | null;
      last_reminded_at: string | null; created_at: string | null;
    };

    const carts = rowsOf<CartRow>(cartRes).map((c) => ({
      id: c.id,
      kind: "cart" as const,
      email: c.email,
      customer_name: c.customer_name,
      phone: c.phone,
      items_json: c.items_json,
      product_slug: null as string | null,
      total_amount: c.total_amount,
      reminder_count: Number(c.reminder_count) || 0,
      last_reminded_at: c.last_reminded_at,
      created_at: c.created_at,
    }));
    const consults = rowsOf<ConsultRow>(consultRes).map((c) => ({
      id: c.id,
      kind: "consultation" as const,
      email: c.email,
      customer_name: c.customer_name,
      phone: c.phone,
      items_json: null,
      product_slug: c.product_slug,
      total_amount: null as number | null,
      reminder_count: Number(c.reminder_count) || 0,
      last_reminded_at: c.last_reminded_at,
      created_at: c.created_at,
    }));

    const items = [...carts, ...consults].sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { payload, user, drizzle, sql } = await ctx();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  let body: { id?: number; kind?: string; action?: string };
  try {
    body = (await req.json()) as { id?: number; kind?: string; action?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const id = Number(body.id);
  const kind = body.kind === "consultation" ? "consultation" : "cart";
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  try {
    if (kind === "consultation") {
      if (body.action === "dismiss") {
        await drizzle.execute(
          sql.raw(
            `UPDATE "consultations"
               SET answers = jsonb_set(COALESCE(answers, '{}'::jsonb), '{_abandoned_dismissed}', 'true'::jsonb),
                   updated_at = now()
             WHERE id = ${id}`,
          ),
        );
        return NextResponse.json({ ok: true });
      }
      const r = await drizzle.execute(
        sql.raw(`SELECT email, full_name, phone FROM "consultations" WHERE id = ${id} LIMIT 1`),
      );
      const c = rowsOf<{ email: string; full_name: string | null; phone: string | null }>(r)[0];
      if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      await sendAbandonedCartEmail(payload, {
        email: c.email,
        name: c.full_name,
        items: [],
        total: null,
        whatsapp: c.phone,
      });
      await drizzle.execute(
        sql.raw(
          `UPDATE "consultations"
             SET answers = jsonb_set(
                   jsonb_set(COALESCE(answers, '{}'::jsonb), '{_cart_reminded_at}', to_jsonb(now()::text)),
                   '{_cart_reminder_count}',
                   to_jsonb(COALESCE((answers->>'_cart_reminder_count')::int, 0) + 1)
                 ),
                 updated_at = now()
           WHERE id = ${id}`,
        ),
      );
      return NextResponse.json({ ok: true });
    }

    // kind === "cart"
    if (body.action === "dismiss") {
      await drizzle.execute(
        sql.raw(`UPDATE "abandoned_carts" SET recovered_at = now(), updated_at = now() WHERE id = ${id}`),
      );
      return NextResponse.json({ ok: true });
    }
    const r = await drizzle.execute(
      sql.raw(
        `SELECT email, customer_name, phone, items_json, total_amount FROM "abandoned_carts" WHERE id = ${id} AND recovered_at IS NULL LIMIT 1`,
      ),
    );
    const cart = rowsOf<{
      email: string; customer_name: string | null; phone: string | null;
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
