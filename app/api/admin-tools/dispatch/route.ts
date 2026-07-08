/**
 * GET /api/admin-tools/dispatch
 *
 * Powers the Dispatch queue (orders awaiting dispatch) and the Dispatched
 * list (orders with a tracking number). Returns paid, non-cancelled orders
 * with the fields those pages need — including the DPD tracking number,
 * which the dispatch-label flow saves into orders.notes as
 * "DPD tracking: <number> (shipment #…)".
 *
 * Accessible to role "admin" AND "staff".
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

/** Pull the DPD tracking number out of the free-text notes column. */
function parseTracking(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/DPD tracking:\s*([^\s(]+)/i);
  return m ? m[1] : null;
}

type OrderRow = {
  id: number;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  notes: string | null;
  status: string | null;
  total_amount: string | number | null;
  items_json: unknown;
  created_at: string | null;
};

type ConsultRow = {
  email: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  product_slug: string | null;
  answers: unknown;
};

type Item = { title: string | null; dose: string | null; quantity: number };

function firstStr(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

/** Parse a "Title (dose) × 2" summary fragment into a structured item. */
function parseSummaryLine(s: string): Item | null {
  const t = s.trim();
  if (!t) return null;
  const m = t.match(/^(.*?)(?:\s*\(([^)]*)\))?\s*[x×]\s*(\d+)\s*$/i);
  if (m) return { title: m[1].trim(), dose: (m[2] ?? "").trim() || null, quantity: Number(m[3]) || 1 };
  return { title: t, dose: null, quantity: 1 };
}

/**
 * Robustly parse orders.items_json — it can be a proper array (native
 * checkout), a JSON string, or a HubSpot-sync shape where the items are a
 * comma-separated summary or nested under `body`. Mirrors the order-detail
 * parser so the dispatch queue shows the same items instead of "—".
 */
function normItems(raw: unknown): Item[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      arr = Array.isArray(p) ? p : [p];
    } catch {
      arr = [raw];
    }
  } else if (raw && typeof raw === "object") {
    arr = [raw];
  }

  const out: Item[] = [];
  for (const el of arr) {
    if (typeof el === "string") {
      for (const part of el.split(",")) {
        const p = parseSummaryLine(part);
        if (p && p.title) out.push(p);
      }
      continue;
    }
    if (el && typeof el === "object") {
      const it = el as Record<string, unknown>;
      const title = firstStr(it.title, it.name, it.product);
      const body = firstStr(it.body);
      if (!title && body) {
        for (const part of body.split(",")) {
          const p = parseSummaryLine(part);
          if (p && p.title) out.push(p);
        }
        continue;
      }
      if (!title) continue;
      out.push({
        title,
        dose: firstStr(it.dose, it.variant) || null,
        quantity: Number(it.quantity ?? it.qty ?? 1) || 1,
      });
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Admin or staff role required" }, { status: 403 });
  }

  // Lightweight counts for the sidebar badges: how many orders are awaiting
  // dispatch vs already dispatched. Same base set (paid, non-cancelled) and
  // same "dispatched" rule as the full read below, but done in one SQL pass
  // so the badges don't pull 300 rows. As soon as an order gets a tracking
  // number it flips from `awaiting` to `dispatched`, so the numbers move.
  if (req.nextUrl.searchParams.get("counts") === "1") {
    try {
      const { drizzle, sql } = await getDrizzle();
      const res = await drizzle.execute(
        sql.raw(`
          SELECT
            COUNT(*) FILTER (WHERE disp)::int      AS dispatched,
            COUNT(*) FILTER (WHERE NOT disp)::int  AS awaiting
          FROM (
            SELECT (
              LOWER(COALESCE(status::text, '')) IN ('shipped','delivered','dispatched')
              OR notes ILIKE '%DPD tracking:%'
            ) AS disp
            FROM orders
            WHERE LOWER(COALESCE(status::text, '')) NOT IN ('cancelled','refunded')
              AND COALESCE(total_amount, 0) > 0
          ) t
        `),
      );
      const row = rowsOf<{ dispatched: number; awaiting: number }>(res)[0];
      return NextResponse.json({
        ok: true,
        awaiting: Number(row?.awaiting ?? 0),
        dispatched: Number(row?.dispatched ?? 0),
      });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: "Count failed", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  try {
    const { drizzle, sql } = await getDrizzle();
    const result = await drizzle.execute(
      sql.raw(`
        SELECT id, order_number, customer_name, customer_email, customer_phone,
               shipping_address, notes, status, total_amount, items_json, created_at
        FROM orders
        WHERE LOWER(COALESCE(status::text, '')) NOT IN ('cancelled', 'refunded')
          AND COALESCE(total_amount, 0) > 0
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 300
      `),
    );
    const rows = rowsOf<OrderRow>(result);

    // Join the most recent consultation per customer email so each card can
    // show the same clinical summary as the clinical queue.
    const emails = Array.from(
      new Set(rows.map((r) => (r.customer_email ?? "").trim().toLowerCase()).filter(Boolean)),
    );
    const consultByEmail = new Map<string, ConsultRow>();
    if (emails.length > 0) {
      const inList = emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(",");
      const cRes = await drizzle.execute(
        sql.raw(`
          SELECT DISTINCT ON (LOWER(email))
                 email, full_name, date_of_birth, product_slug, answers
          FROM consultations
          WHERE LOWER(email) IN (${inList})
          ORDER BY LOWER(email), created_at DESC NULLS LAST, id DESC
        `),
      );
      for (const c of rowsOf<ConsultRow>(cRes)) {
        const key = (c.email ?? "").trim().toLowerCase();
        if (key) consultByEmail.set(key, c);
      }
    }

    const orders = rows.map((r) => {
      const c = consultByEmail.get((r.customer_email ?? "").trim().toLowerCase());
      const statusText = String(r.status ?? "").toLowerCase();
      const trackingNumber = parseTracking(r.notes);
      const dispatched =
        ["shipped", "delivered", "dispatched"].includes(statusText) ||
        Boolean(trackingNumber);
      return {
        id: r.id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerPhone: r.customer_phone,
        shippingAddress: r.shipping_address,
        status: statusText,
        total: Number(r.total_amount ?? 0) || 0,
        createdAt: r.created_at,
        trackingNumber,
        dispatched,
        items: normItems(r.items_json),
        consultation: c
          ? {
              fullName: c.full_name,
              dateOfBirth: c.date_of_birth,
              productSlug: c.product_slug,
              answers:
                c.answers && typeof c.answers === "object" && !Array.isArray(c.answers)
                  ? (c.answers as Record<string, unknown>)
                  : {},
            }
          : null,
      };
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Read failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
