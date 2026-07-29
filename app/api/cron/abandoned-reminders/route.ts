/**
 * GET/POST /api/cron/abandoned-reminders
 *
 * Daily job (Vercel Cron) that emails a recovery reminder to shoppers who left
 * a cart without completing checkout. A cart qualifies when it is:
 *   - not recovered,
 *   - at least 30 minutes old (give them time to finish naturally),
 *   - not reminded in the last 20 hours,
 *   - reminded fewer than 3 times.
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron),
 * reusing the same guard as the HubSpot sync cron.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import { sendAbandonedCartEmail } from "@/lib/account-email";

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

  const due = rowsOf<{
    id: number;
    email: string;
    customer_name: string | null;
    phone: string | null;
    items_json: Array<{ title?: string; dose?: string | null; quantity?: number }> | null;
    total_amount: number | null;
  }>(
    await drizzle.execute(
      sql.raw(`
        SELECT id, email, customer_name, phone, items_json, total_amount
          FROM "abandoned_carts"
         WHERE recovered_at IS NULL
           AND created_at < now() - interval '30 minutes'
           AND (last_reminded_at IS NULL OR last_reminded_at < now() - interval '20 hours')
           AND COALESCE(reminder_count, 0) < 3
         ORDER BY updated_at ASC
         LIMIT 200
      `),
    ),
  );

  let sent = 0;
  let failed = 0;
  for (const cart of due) {
    try {
      await sendAbandonedCartEmail(payload, {
        email: cart.email,
        name: cart.customer_name,
        items: cart.items_json ?? [],
        total: cart.total_amount,
        whatsapp: cart.phone,
      });
      await drizzle.execute(
        sql.raw(
          `UPDATE "abandoned_carts" SET reminder_count = COALESCE(reminder_count,0) + 1, last_reminded_at = now(), updated_at = now() WHERE id = ${cart.id}`,
        ),
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  // Consultation-only leads (filled a consultation, no order yet). Reminder
  // cadence is tracked inside the answers JSON so no schema change is needed.
  const orderExists = `EXISTS (SELECT 1 FROM "orders" o WHERE LOWER(o.customer_email) = LOWER("consultations".email))`;
  const cDue = rowsOf<{ id: number; email: string; full_name: string | null; phone: string | null }>(
    await drizzle.execute(
      sql.raw(`
        SELECT id, email, full_name, phone
          FROM "consultations"
         WHERE status IN ('submitted','reviewed')
           AND email IS NOT NULL AND email <> ''
           AND NOT ${orderExists}
           AND (answers->>'_abandoned_dismissed') IS NULL
           AND created_at < now() - interval '30 minutes'
           AND (
                (answers->>'_cart_reminded_at') IS NULL
                OR (answers->>'_cart_reminded_at')::timestamptz < now() - interval '20 hours'
               )
           AND COALESCE((answers->>'_cart_reminder_count')::int, 0) < 3
         ORDER BY updated_at ASC
         LIMIT 200
      `),
    ),
  );

  for (const c of cDue) {
    try {
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
           WHERE id = ${c.id}`,
        ),
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  console.info("[cron:abandoned-reminders]", {
    via: auth.via,
    due: due.length + cDue.length,
    sent,
    failed,
  });
  return NextResponse.json({ ok: true, carts: due.length, consultations: cDue.length, sent, failed });
}

export const GET = handle;
export const POST = handle;
