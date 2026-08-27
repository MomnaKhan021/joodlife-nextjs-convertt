/**
 * /api/admin-tools/dispatch
 *
 * Powers the Dispatch queue and the Dispatched list. The pipeline is
 * CONSULTATION-DRIVEN: a patient enters the queue when the pharmacist
 * approves supply in the clinical queue (consultations.answers._review_decision
 * = 'approved'). Each approved consultation is joined to the patient's most
 * recent paid order (by email) for the shipping address + items the DPD
 * label needs — but the order is optional (a card with no order can't print
 * a DPD label; the UI disables it).
 *
 * Dispatch state lives on the CONSULTATION (answers._dispatched_at and
 * ._tracking_number), so approving → awaiting-dispatch → dispatched all track
 * the same entity and the sidebar counts move as expected:
 *   GET               → { orders: [...] } (one entry per approved consultation)
 *   GET ?counts=1     → { awaiting, dispatched }
 *   POST { consultationId, trackingNumber? } → stamps the consultation dispatched
 *
 * Accessible to role "admin" AND "staff".
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { backfillReorderBaseline } from "@/lib/reorderBackfill";
import { hideBeforeSql } from "@/lib/adminHide";
import {
  fireHubSpot,
  upsertContact,
  addNoteToContact,
  updateDealStage,
  findDealsByContactEmail,
  isHubSpotEnabled,
  PATIENT_LIFECYCLE_STAGES,
} from "@/lib/hubspot";

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

const UK_POSTCODE_RE = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/i;
const COUNTRY_LABELS = ["united kingdom", "uk", "england", "scotland", "wales", "great britain"];

/** Resolve the delivery address the DPD label would use (shipping_address,
 *  else the "address:" block in notes). Mirrors the dpd-label route. */
function resolveAddress(shippingAddress: string | null, notes: string | null): string {
  const primary = (shippingAddress ?? "").trim();
  if (primary && primary !== "—") return primary;
  const raw = (notes ?? "").trim();
  if (!raw) return "";
  const marker = raw.toLowerCase().indexOf("address:");
  const block = marker >= 0 ? raw.slice(marker + "address:".length) : raw;
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().startsWith("dpd tracking"))
    .join("\n")
    .trim();
}

/** True when the order has enough of an address for DPD (at least one line
 *  that isn't just a postcode or a country name). The Dispatch button is
 *  disabled otherwise, so we never hit DPD's "missing street/town" rejection. */
function addressUsable(shippingAddress: string | null, notes: string | null): boolean {
  const raw = resolveAddress(shippingAddress, notes);
  if (!raw) return false;
  const parts = raw.split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
  const usable = parts.filter((p) => {
    if (COUNTRY_LABELS.includes(p.toLowerCase())) return false;
    // A part that is ONLY a postcode doesn't count as a street/town line.
    const withoutPc = p.replace(UK_POSTCODE_RE, "").trim();
    return withoutPc.length > 0;
  });
  return usable.length >= 1;
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
  updated_at: string | null;
  dispatch_note: string | null;
};

type ConsultRow = {
  id: number;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  product_slug: string | null;
  status: string | null;
  answers: unknown;
  created_at: string | null;
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

  // Approved-for-supply is the gate into the pipeline.
  const hideCond = hideBeforeSql("created_at");
  const APPROVED_WHERE =
    `answers->>'_review_decision' = 'approved'` +
    (hideCond ? ` AND ${hideCond}` : "");

  // Lightweight counts for the sidebar badges. awaiting = approved but not yet
  // dispatched; dispatched = approved with a _dispatched_at stamp. As soon as
  // a patient is dispatched they flip from awaiting → dispatched.
  if (req.nextUrl.searchParams.get("counts") === "1") {
    try {
      const { drizzle, sql } = await getDrizzle();
      const res = await drizzle.execute(
        sql.raw(`
          SELECT
            COUNT(*) FILTER (WHERE disp)::int      AS dispatched,
            COUNT(*) FILTER (WHERE NOT disp)::int  AS awaiting
          FROM (
            SELECT (answers->>'_dispatched_at') IS NOT NULL AS disp
            FROM consultations
            WHERE ${APPROVED_WHERE}
          ) t
        `),
      );
      const row = rowsOf<{ dispatched: number; awaiting: number }>(res)[0];
      // Order-only patients (an order with no consultation at all) are also in
      // the To Dispatch queue — count them so the badge matches the list.
      let orderOnlyAwaiting = 0;
      try {
        const ooRes = await drizzle.execute(
          sql.raw(`
            SELECT COUNT(*)::int AS n
            FROM orders
            WHERE LOWER(COALESCE(status::text,'')) NOT IN ('cancelled', 'refunded', 'shipped', 'delivered')
              ${hideCond ? `AND ${hideCond}` : ""}
              AND LOWER(COALESCE(payment_status::text,'')) = 'paid'
              AND COALESCE(CAST(notes AS TEXT), '') NOT ILIKE '%DPD tracking:%'
              AND NOT EXISTS (
                SELECT 1 FROM "consultations" c
                 WHERE c.email IS NOT NULL AND TRIM(c.email) <> ''
                   AND LOWER(c.email) = LOWER("orders".customer_email)
              )
          `),
        );
        orderOnlyAwaiting = Number(rowsOf<{ n: number }>(ooRes)[0]?.n ?? 0);
      } catch {
        /* non-fatal — fall back to the consultation-only count */
      }
      return NextResponse.json({
        ok: true,
        awaiting: Number(row?.awaiting ?? 0) + orderOnlyAwaiting,
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

    // 1. Every consultation the pharmacist approved for supply — this is who
    //    is in the dispatch pipeline (awaiting or already dispatched).
    const cRes = await drizzle.execute(
      sql.raw(`
        SELECT id, full_name, email, phone, date_of_birth, product_slug,
               status, answers, created_at
        FROM consultations
        WHERE ${APPROVED_WHERE}
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 500
      `),
    );
    const consults = rowsOf<ConsultRow>(cRes);

    // 2. Most-recent paid order per email → shipping address + items for the
    //    DPD label. Optional: a patient with no paid order still appears, but
    //    the card can't print a DPD label until an order exists.
    const emails = Array.from(
      new Set(consults.map((c) => (c.email ?? "").trim().toLowerCase()).filter(Boolean)),
    );
    // ALL candidate orders per email (not just the newest) so each
    // consultation can be paired with its OWN order. Taking only the newest
    // order per email made every consultation for the same patient display the
    // same order number.
    const ordersByEmail = new Map<string, OrderRow[]>();
    if (emails.length > 0) {
      const inList = emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(",");
      const oRes = await drizzle.execute(
        sql.raw(`
          SELECT id, order_number, customer_name, customer_email, customer_phone,
                 shipping_address, notes, status, total_amount, items_json, created_at, updated_at,
                 -- via to_jsonb so this still works before the column is added
                 to_jsonb(orders) ->> 'dispatch_note' AS dispatch_note
          FROM orders
          WHERE LOWER(customer_email) IN (${inList})
            AND LOWER(COALESCE(status::text, '')) NOT IN ('cancelled', 'refunded')
          -- NB: do NOT require total_amount > 0. Fully-discounted/free orders
          -- and the order auto-created on clinical approval are stored at £0;
          -- excluding them made real orders invisible here, so the patient
          -- showed "No order — dispensing only" and had no delivery address
          -- (and therefore no DPD label). The address lives on the order.
          ORDER BY LOWER(customer_email), created_at DESC NULLS LAST, id DESC
        `),
      );
      for (const o of rowsOf<OrderRow>(oRes)) {
        const key = (o.customer_email ?? "").trim().toLowerCase();
        if (!key) continue;
        const list = ordersByEmail.get(key);
        if (list) list.push(o);
        else ordersByEmail.set(key, [o]);
      }
    }

    // Pair each consultation with the closest-in-time order that no other
    // consultation has already claimed, so two rows never show the same order
    // number. Consultations are processed newest-first (query order).
    const claimed = new Set<number>();
    const orderForConsult = new Map<number, OrderRow | null>();
    for (const c of consults) {
      const list = ordersByEmail.get((c.email ?? "").trim().toLowerCase()) ?? [];
      const consultAt = c.created_at ? +new Date(c.created_at) : NaN;
      let best: OrderRow | null = null;
      let bestGap = Number.POSITIVE_INFINITY;
      for (const o of list) {
        if (claimed.has(Number(o.id))) continue;
        const orderAt = o.created_at ? +new Date(o.created_at) : NaN;
        const gap =
          Number.isNaN(consultAt) || Number.isNaN(orderAt)
            ? Number.MAX_SAFE_INTEGER
            : Math.abs(orderAt - consultAt);
        if (gap < bestGap) {
          bestGap = gap;
          best = o;
        }
      }
      if (best) claimed.add(Number(best.id));
      orderForConsult.set(c.id, best);
    }

    const orders = consults.map((c) => {
      let answers: Record<string, unknown> = {};
      try {
        answers =
          c.answers && typeof c.answers === "object" && !Array.isArray(c.answers)
            ? (c.answers as Record<string, unknown>)
            : JSON.parse(String(c.answers ?? "{}"));
      } catch {
        answers = {};
      }
      const o = orderForConsult.get(c.id) ?? null;
      const dispatchedAt =
        typeof answers._dispatched_at === "string" ? answers._dispatched_at : null;
      const tracking =
        typeof answers._tracking_number === "string" && answers._tracking_number
          ? (answers._tracking_number as string)
          : parseTracking(o?.notes ?? null);
      return {
        // id = consultation id: dispatch state (POST below) keys off this.
        id: c.id,
        // orderId = the matched order, needed for the DPD label (may be null).
        orderId: o?.id ?? null,
        hasOrder: Boolean(o),
        // Can we actually create a DPD label? Needs an order with a usable
        // delivery address — otherwise DPD rejects "missing street/town".
        canDispatch: Boolean(o) && addressUsable(o?.shipping_address ?? null, o?.notes ?? null),
        orderNumber: o?.order_number ?? null,
        dispatchNote: o?.dispatch_note ?? null,
        customerName: c.full_name ?? o?.customer_name ?? null,
        customerEmail: c.email ?? o?.customer_email ?? null,
        customerPhone: c.phone ?? o?.customer_phone ?? null,
        shippingAddress: o?.shipping_address ?? null,
        status: dispatchedAt ? "dispatched" : "approved",
        total: Number(o?.total_amount ?? 0) || 0,
        createdAt: c.created_at,
        // When the matched ORDER was placed — used to sort the queues so the
        // most recent order (highest JL number) is always at the top.
        orderCreatedAt: o?.created_at ?? null,
        dispatchedAt,
        trackingNumber: tracking,
        dispatched: Boolean(dispatchedAt),
        items: o ? normItems(o.items_json) : [],
        consultation: {
          fullName: c.full_name,
          dateOfBirth: c.date_of_birth,
          productSlug: c.product_slug,
          answers,
        },
      };
    });

    // Also surface ORDER-ONLY patients — orders not represented by a
    // consultation above. Two cases:
    //   a) already dispatched directly from the orders flow (shipped/delivered
    //      or given a DPD tracking number) → shows under Dispatched;
    //   b) NO consultation exists for that email at all → there is no clinical
    //      gate, so the order belongs in To Dispatch and can be dispensed +
    //      dispatched straight away with its own order number and address.
    // Orders whose patient has a consultation still awaiting review are
    // deliberately excluded — they must pass Clinical Check first.
    try {
      const seen = new Set(
        orders.map((e) => (e.orderNumber ?? "").toLowerCase()).filter(Boolean),
      );
      const alreadyDispatchedExpr = `(LOWER(COALESCE(status::text,'')) IN ('shipped','delivered')
                 OR COALESCE(CAST(notes AS TEXT), '') ILIKE '%DPD tracking:%')`;
      const noConsultExpr = `NOT EXISTS (
                 SELECT 1 FROM "consultations" c
                  WHERE c.email IS NOT NULL AND TRIM(c.email) <> ''
                    AND LOWER(c.email) = LOWER("orders".customer_email)
               )`;
      const dispRes = await drizzle.execute(
        sql.raw(`
          SELECT id, order_number, customer_name, customer_email, customer_phone,
                 shipping_address, notes, status, total_amount, items_json, created_at
          FROM orders
          WHERE LOWER(COALESCE(status::text,'')) NOT IN ('cancelled', 'refunded')
            ${hideCond ? `AND ${hideCond}` : ""}
            AND (
              ${alreadyDispatchedExpr}
              -- An order-only customer joins the queue only once they have
              -- actually PAID. Without this, abandoned checkouts (payment
              -- never completed) were queued up as work to dispatch.
              OR (${noConsultExpr} AND LOWER(COALESCE(payment_status::text,'')) = 'paid')
            )
          ORDER BY created_at DESC NULLS LAST, id DESC
          LIMIT 500
        `),
      );
      for (const o of rowsOf<OrderRow>(dispRes)) {
        const num = (o.order_number ?? "").toLowerCase();
        if (num && seen.has(num)) continue;
        const status = String(o.status ?? "").toLowerCase();
        const tracking = parseTracking(o.notes ?? null);
        const isDispatched =
          ["shipped", "delivered"].includes(status) || Boolean(tracking);
        orders.push({
          id: 1_000_000_000 + Number(o.id),
          orderId: o.id,
          hasOrder: true,
          // Order-only patients can be dispatched as soon as the saved address
          // is usable by DPD.
          canDispatch: !isDispatched && addressUsable(o.shipping_address ?? null, o.notes ?? null),
          orderNumber: o.order_number ?? null,
          dispatchNote: o.dispatch_note ?? null,
          customerName: o.customer_name ?? null,
          customerEmail: o.customer_email ?? null,
          customerPhone: o.customer_phone ?? null,
          shippingAddress: o.shipping_address ?? null,
          status: isDispatched ? "dispatched" : "approved",
          dispatchedAt: isDispatched ? (o.updated_at ?? null) : null,
          total: Number(o.total_amount ?? 0) || 0,
          createdAt: o.created_at,
          orderCreatedAt: o.created_at,
          trackingNumber: tracking,
          dispatched: isDispatched,
          items: normItems(o.items_json),
          consultation: {
            fullName: o.customer_name ?? null,
            dateOfBirth: null,
            productSlug: null,
            answers: {},
          },
        });
      }
    } catch {
      /* non-fatal — standalone dispatched orders are a bonus view */
    }

    // Newest order first. Sorting here (rather than relying on the query
    // order) fixes two problems: entries were ordered by CONSULTATION date so
    // order numbers looked shuffled, and standalone dispatched orders were
    // appended at the end regardless of date. Falls back to the numeric part
    // of the order number (JL numbers are sequential), then the record date.
    const numOf = (s: string | null): number => {
      const m = /(\d+)/.exec(s ?? "");
      return m ? Number(m[1]) : Number.NEGATIVE_INFINITY;
    };
    const timeOf = (v: string | null): number => {
      if (!v) return Number.NEGATIVE_INFINITY;
      const t = +new Date(v);
      return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
    };
    orders.sort((a, b) => {
      const at = timeOf(a.orderCreatedAt ?? a.createdAt);
      const bt = timeOf(b.orderCreatedAt ?? b.createdAt);
      if (at !== bt) return bt - at;
      const an = numOf(a.orderNumber);
      const bn = numOf(b.orderNumber);
      if (an !== bn) return bn - an;
      return timeOf(b.createdAt) - timeOf(a.createdAt);
    });

    // GPHC compliance: carry DOB / height / weight / age into reorders from the
    // patient's most recent new-supply consultation, so the To Dispatch clinical
    // summary shows the baseline (same as Clinical Check) instead of "—".
    try {
      await backfillReorderBaseline(
        orders.map((o) => ({
          email: o.customerEmail,
          isReorder: (o.consultation?.productSlug ?? "") === "reorder",
          answers: o.consultation?.answers ?? {},
        })),
        drizzle,
        sql,
      );
    } catch {
      /* backfill is best-effort — never block the dispatch queue */
    }

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Read failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin-tools/dispatch
 * Body: { consultationId: number, trackingNumber?: string }
 *
 * Marks an approved consultation as dispatched by stamping _dispatched_at
 * (and _tracking_number when a DPD label was created) into its answers JSON.
 * This moves it out of the Dispatch queue and into Dispatched.
 */
export async function POST(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Admin or staff role required" }, { status: 403 });
  }

  let body: {
    consultationId?: number;
    orderId?: number;
    trackingNumber?: string;
    stage?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // stage="dispensing" records that the dispensing (medicine) label was
  // printed WITHOUT dispatching. Dispatch itself requires the DPD label, so
  // every dispatched parcel carries a real tracking number.
  const isDispensingOnly = body.stage === "dispensing";
  const id = Number(body.consultationId);
  if (!id || !Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: "consultationId required" }, { status: 400 });
  }
  const tracking =
    typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";

  try {
    const { drizzle, sql } = await getDrizzle();
    const nowIso = new Date().toISOString();

    // Dispensing-label print only: record it and stop. The patient stays in
    // To Dispatch until the DPD dispatch label is created, so nothing reaches
    // Dispatched (or leaves the Orders queue) without a tracking number.
    if (isDispensingOnly) {
      const patch = JSON.stringify({ _dispensing_printed_at: nowIso }).replace(/'/g, "''");
      await drizzle.execute(
        sql.raw(`
          UPDATE consultations
          SET answers = COALESCE(answers, '{}'::jsonb) || '${patch}'::jsonb,
              updated_at = now()
          WHERE id = ${id}
        `),
      );
      return NextResponse.json({ ok: true, id, dispensingPrintedAt: nowIso });
    }

    const merge: Record<string, string> = { _dispatched_at: nowIso };
    if (tracking) merge._tracking_number = tracking;
    const mergeJson = JSON.stringify(merge).replace(/'/g, "''");
    await drizzle.execute(
      sql.raw(`
        UPDATE consultations
        SET answers = COALESCE(answers, '{}'::jsonb) || '${mergeJson}'::jsonb,
            updated_at = now()
        WHERE id = ${id}
      `),
    );

    // Also mark the linked ORDER dispatched (status -> shipped) so it leaves
    // the Orders "To do" tab and the active count drops to zero — dispatched
    // orders live under Dispatched, not in the order job queue. The DPD path
    // already removes it via its tracking note; this covers the dispensing-
    // only path (no DPD) which otherwise left the order stuck in "To do".
    const orderId = Number(body.orderId);
    if (orderId && Number.isFinite(orderId)) {
      await drizzle.execute(
        sql.raw(`
          UPDATE orders
          SET status = 'shipped', updated_at = now()
          WHERE id = ${orderId}
            AND LOWER(COALESCE(status::text, '')) NOT IN ('cancelled', 'refunded', 'shipped', 'delivered')
        `),
      );
    }

    // Mirror to HubSpot so the patient lifecycle board matches the dashboard:
    // contact status -> dispatched, newest deal -> the "Dispatched" pipeline
    // stage, and a timeline note carrying the DPD tracking number.
    if (isHubSpotEnabled()) {
      try {
        const row = (await drizzle.execute(
          sql.raw(`SELECT email, full_name FROM consultations WHERE id = ${id} LIMIT 1`),
        )) as { rows?: Array<{ email?: string; full_name?: string }> } | Array<{ email?: string; full_name?: string }>;
        const rows = Array.isArray(row) ? row : (row.rows ?? []);
        const email = (rows[0]?.email ?? "").trim();
        const fullName = (rows[0]?.full_name ?? "").trim() || `Patient #${id}`;
        if (email) {
          const dispatchNote =
            `<p><b>Order dispatched</b></p>` +
            `<p>Patient: ${fullName} · Consultation reference: #${id}</p>` +
            (tracking
              ? `<p>DPD tracking: <b>${tracking}</b> — ` +
                `<a href="https://track.dpd.co.uk/parcels/${encodeURIComponent(tracking)}">track parcel</a></p>`
              : "") +
            `<p>Dispatched at ${nowIso}</p>`;
          // Fire-and-forget — never block or fail the dispatch response.
          void (async () => {
            await fireHubSpot("dispatch:contact", () =>
              upsertContact({
                email,
                extra: {
                  jood_consultation_status: "dispatched",
                  ...(tracking ? { jood_tracking_number: tracking } : {}),
                },
              }),
            );
            await fireHubSpot("dispatch:deal-stage", async () => {
              const dealsRes = await findDealsByContactEmail(email);
              if (!dealsRes.ok || dealsRes.data.length === 0) return { ok: true, data: { id: "" } };
              const latestDeal = dealsRes.data[0];
              return updateDealStage(latestDeal.id, PATIENT_LIFECYCLE_STAGES.dispatched, {
                jood_consultation_status: "dispatched",
              });
            });
            await fireHubSpot("dispatch:note", () => addNoteToContact(email, dispatchNote));
          })();
        }
      } catch {
        /* HubSpot mirror is best-effort — dispatch already succeeded */
      }
    }

    return NextResponse.json({
      ok: true,
      id,
      dispatchedAt: nowIso,
      trackingNumber: tracking || null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Dispatch update failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
