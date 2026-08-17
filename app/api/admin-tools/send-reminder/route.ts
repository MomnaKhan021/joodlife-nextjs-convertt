/**
 * POST /api/admin-tools/send-reminder
 *
 * Admin-only. Emails a patient a "please book your video consultation"
 * reminder (used from the Clinical Queue for consultations that were submitted
 * but never booked). Best-effort HubSpot note is logged alongside.
 *
 * Body: { id?: number, email?: string, name?: string }
 *   -> { ok: true, sentTo: string }
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { sendConsultationReminderEmail } from "@/lib/account-email";
import { addNoteToContact, isHubSpotEnabled } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

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

  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  let body: { id?: number; email?: string; name?: string };
  try {
    body = (await req.json()) as { id?: number; email?: string; name?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  let email = (body.email ?? "").trim();
  let name = (body.name ?? "").trim();

  // Fall back to the consultation record when only an id is given.
  if ((!email || !name) && body.id != null) {
    try {
      const drizzle = (
        payload.db as unknown as { drizzle?: DrizzleLike }
      ).drizzle as DrizzleLike;
      const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
      const rows = readRows<{ email: string | null; full_name: string | null }>(
        await drizzle.execute(
          sql.raw(
            `SELECT email, full_name FROM consultations WHERE id = ${Number(body.id)} LIMIT 1`,
          ),
        ),
      );
      if (rows[0]) {
        email = email || (rows[0].email ?? "").trim();
        name = name || (rows[0].full_name ?? "").trim();
      }
    } catch {
      /* fall through — validation below handles a missing email */
    }
  }

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "No email on record for this patient" },
      { status: 400 },
    );
  }

  try {
    await sendConsultationReminderEmail(payload, { email, name });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  // Stamp the consultation so the Clinical Queue can show a persistent
  // "Reminder sent · <date>" tag (survives reloads) — best-effort.
  try {
    const drizzle = (
      payload.db as unknown as { drizzle?: DrizzleLike }
    ).drizzle as DrizzleLike;
    const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
    const sentAt = new Date().toISOString();
    const by = (
      (user as unknown as { name?: string; email?: string }).name ??
      (user as unknown as { email?: string }).email ??
      "admin"
    ).replace(/'/g, "''");
    const patch = JSON.stringify({
      _reminder_sent_at: sentAt,
      _reminder_sent_by: by,
    }).replace(/'/g, "''");
    const target =
      body.id != null
        ? `id = ${Number(body.id)}`
        : `LOWER(email) = '${email.toLowerCase().replace(/'/g, "''")}'`;
    await drizzle.execute(
      sql.raw(
        `UPDATE "consultations"
           SET answers = COALESCE(answers, '{}'::jsonb) || '${patch}'::jsonb,
               updated_at = now()
         WHERE ${target} AND status <> 'draft'`,
      ),
    );
  } catch {
    /* stamp is best-effort — the email already went out */
  }

  // Best-effort audit note in HubSpot — never blocks the reminder.
  if (isHubSpotEnabled()) {
    try {
      await addNoteToContact(
        email,
        `Consultation booking reminder sent by ${
          (user as unknown as { name?: string; email?: string }).name ??
          (user as unknown as { email?: string }).email ??
          "admin"
        }.`,
      );
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true, sentTo: email });
}
