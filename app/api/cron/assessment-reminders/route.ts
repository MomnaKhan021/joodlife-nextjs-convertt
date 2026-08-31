/**
 * GET/POST /api/cron/assessment-reminders
 *
 * Recovers people who STARTED the questionnaire but never submitted it.
 * Runs hourly; each consultation gets at most two nudges:
 *
 *   1. ~2 hours after they stopped (long enough not to nag someone who is
 *      mid-questionnaire, soon enough that they still remember starting).
 *   2. ~24 hours after that first nudge, if they still haven't finished.
 *
 * A draft that has since been submitted, or whose patient has an order, is
 * skipped — they are handled by the Clinical Check and Abandoned Checkout
 * queues instead. Cadence is tracked inside the answers JSON, so no schema
 * change is needed.
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron),
 * the same guard as the other scheduled jobs.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import { sendAssessmentReminderEmail } from "@/lib/account-email";

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

  // Someone who already placed an order isn't an abandoned assessment.
  const orderExists = `EXISTS (SELECT 1 FROM "orders" o WHERE LOWER(o.customer_email) = LOWER("consultations".email))`;

  const due = rowsOf<{
    id: number;
    email: string;
    full_name: string | null;
    product_slug: string | null;
    sent: number;
  }>(
    await drizzle.execute(
      sql.raw(`
        SELECT id, email, full_name, product_slug,
               COALESCE((answers->>'_assessment_reminder_count')::int, 0) AS sent
          FROM "consultations"
         WHERE status = 'draft'
           AND email IS NOT NULL AND TRIM(email) <> ''
           AND NOT ${orderExists}
           AND (answers->>'_assessment_dismissed') IS NULL
           -- Left it alone for at least 2 hours (updated_at moves as they answer).
           AND COALESCE(updated_at, created_at) < now() - interval '2 hours'
           AND COALESCE((answers->>'_assessment_reminder_count')::int, 0) < 2
           -- Second nudge only a day after the first.
           AND (
                (answers->>'_assessment_reminded_at') IS NULL
                OR (answers->>'_assessment_reminded_at')::timestamptz < now() - interval '24 hours'
               )
         ORDER BY COALESCE(updated_at, created_at) ASC
         LIMIT 200
      `),
    ),
  );

  let sent = 0;
  let failed = 0;
  for (const c of due) {
    const attempt = Number(c.sent ?? 0) + 1;
    try {
      await sendAssessmentReminderEmail(payload, {
        email: c.email,
        name: c.full_name,
        productSlug: c.product_slug,
        attempt,
      });
      await drizzle.execute(
        sql.raw(
          `UPDATE "consultations"
             SET answers = jsonb_set(
                   jsonb_set(COALESCE(answers, '{}'::jsonb), '{_assessment_reminded_at}', to_jsonb(now()::text)),
                   '{_assessment_reminder_count}',
                   to_jsonb(${attempt}::int)
                 ),
                 updated_at = updated_at
           WHERE id = ${c.id}`,
        ),
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  console.info("[cron:assessment-reminders]", { via: auth.via, due: due.length, sent, failed });
  return NextResponse.json({ ok: true, due: due.length, sent, failed });
}

export const GET = handle;
export const POST = handle;
