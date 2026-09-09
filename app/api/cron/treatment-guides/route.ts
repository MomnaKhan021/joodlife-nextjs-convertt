/**
 * GET/POST /api/cron/treatment-guides
 *
 * Daily job (Vercel Cron, 17:00 UTC = early evening UK) that sends the
 * PHASE-2 ONBOARDING-4 "How to use your pen" email on delivery day.
 *
 * We have no delivered webhook from DPD, so delivery day is inferred from the
 * dispatch: DPD is next-day, and the label route stamps `dispatched_at` when it
 * sends the dispatch email. An order qualifies when it:
 *   - was dispatched at least 16 hours ago (so a label made Monday evening is
 *     emailed Tuesday evening, after the parcel has landed),
 *   - is not older than 7 days (don't back-fill ancient orders),
 *   - contains an injectable pen (Wegovy / Mounjaro); Wegovy Pill orders are
 *     marked handled without an email — the pen guide would be wrong for them,
 *   - hasn't been sent this email before (claimed atomically per row so an
 *     overlapping run can never double-send).
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron),
 * the same guard as the other crons.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import { sendTreatmentGuideEmail } from "@/lib/account-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

/** True when at least one line item is an injectable pen rather than the pill. */
function hasPenItem(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((it) => {
    const o = (it ?? {}) as { title?: unknown; name?: unknown };
    const title = String(o.title ?? o.name ?? "");
    return /wegovy|mounjaro|ozempic|saxenda|tirzepatide|semaglutide|pen/i.test(title) && !/pill|tablet|oral/i.test(title);
  });
}

async function handle(req: NextRequest) {
  const auth = await authorizeAdminOrCron(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle as DrizzleLike;
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };

  await drizzle.execute(
    sql.raw(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
                            ADD COLUMN IF NOT EXISTS treatment_guide_email_sent boolean`,
    ),
  );

  // Orders dispatched before dispatched_at existed fall back to updated_at,
  // which the label route bumps when it marks the order shipped.
  const due = rowsOf<{
    id: number;
    order_number: string | null;
    customer_email: string | null;
    customer_name: string | null;
    items_json: unknown;
  }>(
    await drizzle.execute(
      sql.raw(`
        SELECT id, order_number, customer_email, customer_name, items_json
          FROM "orders"
         WHERE COALESCE(treatment_guide_email_sent, false) = false
           AND COALESCE(dispatch_email_sent, false) = true
           AND COALESCE(customer_email, '') <> ''
           AND LOWER(COALESCE(status::text, '')) NOT IN ('cancelled', 'refunded')
           AND COALESCE(dispatched_at, updated_at) < now() - interval '16 hours'
           AND COALESCE(dispatched_at, updated_at) > now() - interval '7 days'
         ORDER BY COALESCE(dispatched_at, updated_at) ASC
         LIMIT 200
      `),
    ),
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const o of due) {
    // Claim first so a concurrent run can't pick the same order up.
    const claim = rowsOf<{ id: number }>(
      await drizzle.execute(
        sql.raw(
          `UPDATE "orders" SET treatment_guide_email_sent = true
             WHERE id = ${o.id} AND COALESCE(treatment_guide_email_sent, false) = false
             RETURNING id`,
        ),
      ),
    );
    if (claim.length === 0) continue;

    if (!hasPenItem(o.items_json)) {
      skipped += 1; // pill-only order — no pen guide to send
      continue;
    }

    try {
      await sendTreatmentGuideEmail(payload, {
        email: String(o.customer_email).trim(),
        name: o.customer_name,
        orderNumber: o.order_number,
      });
      sent += 1;
    } catch (e) {
      failed += 1;
      console.error("[treatment-guides] email failed for order", o.id, e);
      // Release the claim so tomorrow's run retries it.
      await drizzle.execute(
        sql.raw(`UPDATE "orders" SET treatment_guide_email_sent = false WHERE id = ${o.id}`),
      );
    }
  }

  return NextResponse.json({ ok: true, due: due.length, sent, skipped, failed });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
