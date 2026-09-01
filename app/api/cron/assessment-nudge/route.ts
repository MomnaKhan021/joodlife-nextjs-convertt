/**
 * GET/POST /api/cron/assessment-nudge
 *
 * The Day 4–5 "still thinking it over?" nudge.
 *
 * Audience: a lead who engaged — started an assessment and left us their
 * email — but never completed it, four to five days on. They have already had
 * the two same-week reminders from /api/cron/assessment-reminders, so this is
 * a different message: reassurance and an offer to talk to a human, with no
 * deadline or scarcity of any kind.
 *
 * ONE SEND ONLY. `_assessment_nudge_at` is stamped into the answers JSON the
 * moment it goes out and is checked here, so a re-run — or a manual trigger —
 * can never send it twice.
 *
 * Runs daily; the 4–6 day window is deliberately wider than "day 4–5" so a
 * missed or late run still catches the lead rather than skipping them.
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron),
 * the same guard as the other scheduled jobs.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import { sendAssessmentNudgeEmail } from "@/lib/account-email";

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

  // Someone who has since ordered isn't an unfinished assessment any more.
  const orderExists = `EXISTS (SELECT 1 FROM "orders" o WHERE LOWER(o.customer_email) = LOWER("consultations".email))`;

  const due = rowsOf<{
    id: number;
    email: string;
    full_name: string | null;
    product_slug: string | null;
  }>(
    await drizzle.execute(
      sql.raw(`
        SELECT id, email, full_name, product_slug
          FROM "consultations"
         WHERE status = 'draft'
           AND email IS NOT NULL AND TRIM(email) <> ''
           AND NOT ${orderExists}
           AND (answers->>'_assessment_dismissed') IS NULL
           -- One send only, ever.
           AND (answers->>'_assessment_nudge_at') IS NULL
           -- Day 4–5 since they engaged, with a day of slack either side.
           AND created_at < now() - interval '4 days'
           AND created_at > now() - interval '6 days'
           -- Still untouched: they haven't come back and carried on.
           AND COALESCE(updated_at, created_at) < now() - interval '2 days'
         ORDER BY created_at ASC
         LIMIT 200
      `),
    ),
  );

  let sent = 0;
  let failed = 0;
  for (const c of due) {
    try {
      await sendAssessmentNudgeEmail(payload, {
        email: c.email,
        name: c.full_name,
        productSlug: c.product_slug,
      });
      await drizzle.execute(
        sql.raw(
          `UPDATE "consultations"
             SET answers = jsonb_set(
                   COALESCE(answers, '{}'::jsonb),
                   '{_assessment_nudge_at}',
                   to_jsonb(now()::text)
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

  console.info("[cron:assessment-nudge]", { via: auth.via, due: due.length, sent, failed });
  return NextResponse.json({ ok: true, due: due.length, sent, failed });
}

export const GET = handle;
export const POST = handle;
