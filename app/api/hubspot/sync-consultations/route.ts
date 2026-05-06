/**
 * POST /api/hubspot/sync-consultations
 * Admin-only. Pulls consultation custom-object records from HubSpot
 * in pages and upserts them into our `consultations` table.
 *
 *   Body (optional): { limit?: number, after?: string }
 *   Returns:        { ok, fetched, inserted, updated, errors, nextAfter }
 *
 * Re-call with the returned `nextAfter` to fetch the next page.
 *
 * Upsert key: `hubspot_object_id`. The custom object's intrinsic
 * HubSpot id is stable across edits, so it's the right anchor for
 * idempotent re-runs.
 *
 * Customer association: email-first (links to existing user_id if
 * one exists; never auto-creates — that's /sync-contacts' job).
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { isHubSpotEnabled, listConsultationRecords } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: SqlRaw;
}> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: SqlRaw;
  };
  return { drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";
}

function escNum(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "NULL";
  return String(n);
}

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

function mapStatus(raw: string | undefined): string {
  const s = (raw || "").toLowerCase().trim();
  const allowed = ["draft", "submitted", "reviewed", "approved", "rejected"];
  return allowed.includes(s) ? s : "submitted";
}

function parseAnswers(raw: string | undefined): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" },
      { status: 400 }
    );
  }

  let body: { limit?: number; after?: string };
  try {
    body = (await req.json()) as { limit?: number; after?: string };
  } catch {
    body = {};
  }
  const limit = Math.min(Math.max(Number(body.limit ?? 100), 1), 100);

  const fetched = await listConsultationRecords(body.after, limit);
  if (!fetched.ok) {
    return NextResponse.json(
      { ok: false, status: fetched.status, error: fetched.error },
      { status: 502 }
    );
  }

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
  try {
    const d = await getDrizzle();
    drizzle = d.drizzle;
    sql = d.sql;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "DB init failed", detail: String(err) },
      { status: 500 }
    );
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const r of fetched.data.results) {
    const p = r.properties;
    const objectId = r.id;

    try {
      const email = (p.email ?? r.contactEmail ?? "").trim();
      const fullName = (p.full_name ?? p.fullname ?? "").trim();
      const phone = (p.phone ?? "").trim();
      const dateOfBirth = (p.date_of_birth ?? p.dob ?? "").trim();
      const productSlug = (p.product_slug ?? "").trim();
      const dose = (p.dose ?? "").trim();
      const status = mapStatus(p.consultation_status ?? p.status);
      const answers = parseAnswers(p.answers);
      const answersLiteral = esc(JSON.stringify(answers));

      // Look up matching user_id (email-based, no auto-create)
      let userId: number | null = null;
      if (email) {
        const userRes = await drizzle.execute(
          sql.raw(`SELECT id FROM "users" WHERE email = ${esc(email)} LIMIT 1;`)
        );
        const ur = readRows<{ id: number }>(userRes);
        if (ur[0]) userId = ur[0].id;
      }

      // 1. UPDATE by hubspot_object_id
      const updateStmt = `
        UPDATE "consultations"
        SET email          = COALESCE(${esc(email || null)}, email),
            full_name      = COALESCE(${esc(fullName || null)}, full_name),
            phone          = COALESCE(${esc(phone || null)}, phone),
            date_of_birth  = COALESCE(${esc(dateOfBirth || null)}, date_of_birth),
            product_slug   = COALESCE(${esc(productSlug || null)}, product_slug),
            dose           = COALESCE(${esc(dose || null)}, dose),
            answers        = ${answersLiteral}::jsonb,
            status         = ${esc(status)},
            user_id        = COALESCE(${escNum(userId)}, user_id),
            updated_at     = now()
        WHERE hubspot_object_id = ${esc(objectId)}
        RETURNING id;
      `;
      const updateRes = await drizzle.execute(sql.raw(updateStmt));
      if (readRows<{ id: number }>(updateRes).length > 0) {
        updated++;
        continue;
      }

      // 2. INSERT new row
      const insertStmt = `
        INSERT INTO "consultations"
          (hubspot_object_id, email, full_name, phone, date_of_birth,
           product_slug, dose, answers, status, user_id,
           updated_at, created_at)
        VALUES
          (${esc(objectId)}, ${esc(email || null)}, ${esc(fullName || null)},
           ${esc(phone || null)}, ${esc(dateOfBirth || null)},
           ${esc(productSlug || null)}, ${esc(dose || null)},
           ${answersLiteral}::jsonb, ${esc(status)}, ${escNum(userId)},
           now(), now())
        RETURNING id;
      `;
      const insertRes = await drizzle.execute(sql.raw(insertStmt));
      if (readRows<{ id: number }>(insertRes).length > 0) inserted++;
    } catch (err) {
      errors.push(
        `consultation ${objectId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: fetched.data.results.length,
    inserted,
    updated,
    errors: errors.slice(0, 10),
    nextAfter: fetched.data.nextAfter,
  });
}
