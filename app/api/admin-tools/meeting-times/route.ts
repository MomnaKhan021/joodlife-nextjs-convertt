/**
 * POST /api/admin-tools/meeting-times
 *
 * Admin-only. Given a list of patient emails, returns each one's booked
 * consultation start time (from the associated HubSpot meeting/appointment) so
 * the Clinical Queue can sort by consultation time.
 *
 * Body: { emails: string[] }  (capped at 60 per request)
 *   -> { ok: true, times: { [email]: string | null } }
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { getMeetingInfoForEmails, isHubSpotEnabled } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 },
    );
  }

  // Admin session OR the maintenance secret (so the call-time cache can be
  // backfilled for the WHOLE queue from a script, not just viewed pages).
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const secretOk =
    secret.length >= 16 &&
    ((Boolean(process.env.PAYLOAD_SECRET) && secret === process.env.PAYLOAD_SECRET) ||
      (Boolean(process.env.ADMIN_BOOTSTRAP_SECRET) && secret === process.env.ADMIN_BOOTSTRAP_SECRET));
  const { user } = await payload.auth({ headers: await nextHeaders() });
  const isAdminUser = Boolean(user && (user as unknown as { role?: string }).role === "admin");
  if (!isAdminUser && !secretOk) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  if (!isHubSpotEnabled()) {
    // No HubSpot → no times/links; return empty maps rather than error so the
    // queue falls back to submission-order sorting and hides Join buttons.
    return NextResponse.json({ ok: true, times: {}, links: {} });
  }

  const drizzleForRead = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  const { sql: sqlForRead } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  const asRows = (x: unknown): Array<Record<string, unknown>> =>
    Array.isArray(x) ? (x as Array<Record<string, unknown>>) : ((x as { rows?: Array<Record<string, unknown>> })?.rows ?? []);

  let emails: string[] = [];
  // ?backfill=1 — pick the next batch of pending video-consult patients whose
  // call time hasn't been cached (or is stale), so a simple loop can cache the
  // entire queue and the global upcoming-first ordering becomes accurate.
  const backfill = req.nextUrl.searchParams.get("backfill") === "1";
  let remaining = 0;
  if (backfill) {
    if (!drizzleForRead?.execute) {
      return NextResponse.json({ ok: false, error: "db unavailable" }, { status: 500 });
    }
    const cond = `status IN ('submitted', 'reviewed')
        AND email IS NOT NULL AND TRIM(email) <> ''
        AND COALESCE(answers->>'video_consultation_preference', '') NOT IN ('', 'false')
        AND (
          answers->>'_meeting_checked_at' IS NULL
          OR NOT (COALESCE(answers->>'_meeting_checked_at','') ~ '^\\d{4}-\\d{2}-\\d{2}')
          OR (answers->>'_meeting_checked_at')::timestamptz < now() - interval '12 hours'
        )`;
    const rows = asRows(
      await drizzleForRead.execute(
        sqlForRead.raw(
          `SELECT DISTINCT LOWER(email) AS email FROM "consultations" WHERE ${cond} LIMIT 40`,
        ),
      ),
    );
    emails = rows.map((r) => String(r.email ?? "")).filter(Boolean);
    const cnt = asRows(
      await drizzleForRead.execute(
        sqlForRead.raw(
          `SELECT COUNT(DISTINCT LOWER(email))::int AS n FROM "consultations" WHERE ${cond}`,
        ),
      ),
    );
    remaining = Math.max(0, Number(cnt[0]?.n ?? 0) - emails.length);
  } else {
    let body: { emails?: unknown };
    try {
      body = (await req.json()) as { emails?: unknown };
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    emails = Array.isArray(body.emails)
      ? body.emails.filter((e): e is string => typeof e === "string").slice(0, 60)
      : [];
  }

  const info = await getMeetingInfoForEmails(emails);
  const times: Record<string, string | null> = {};
  const links: Record<string, string | null> = {};
  for (const [email, v] of Object.entries(info)) {
    times[email] = v.startsAt;
    links[email] = v.joinUrl;
  }

  // Persist each lookup onto the patient's consultation rows so the queue can
  // ORDER BY call time server-side (upcoming first, then latest finished) and
  // future page loads skip the HubSpot round-trip. Best effort — a failure
  // here never breaks the response.
  try {
    const drizzle = (
      payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
    ).drizzle;
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    if (drizzle?.execute) {
      const checkedAt = new Date().toISOString();
      // Only persist emails with a DEFINITIVE lookup result (present in
      // `info`). Inconclusive lookups (rate-limited / errored) are omitted so
      // we never cache a false "not booked" — they simply get retried next
      // load instead of being parked in the wrong tab for up to 12h.
      for (const key of Object.keys(info)) {
        if (!key) continue;
        const patch = JSON.stringify({
          _meeting_start: times[key] ?? null,
          _meeting_join: links[key] ?? null,
          _meeting_checked_at: checkedAt,
        }).replace(/'/g, "''");
        await drizzle.execute(
          drizzleSql.raw(
            `UPDATE "consultations"
             SET answers = COALESCE(answers, '{}'::jsonb) || '${patch}'::jsonb
             WHERE LOWER(email) = '${key.replace(/'/g, "''")}' AND status <> 'draft'`,
          ),
        );
      }
    }
  } catch {
    /* cache write is best-effort */
  }

  return NextResponse.json({
    ok: true,
    times,
    links,
    ...(backfill ? { processed: emails.length, remaining } : {}),
  });
}
