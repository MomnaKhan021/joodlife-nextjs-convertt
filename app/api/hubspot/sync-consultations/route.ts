/**
 * POST /api/hubspot/sync-consultations
 * Admin-or-CRON. Pulls consultation custom-object records from
 * HubSpot in pages and upserts them into our `consultations` table.
 *
 *   Body (optional): { limit?: number, after?: string }
 *   Returns:        { ok, fetched, inserted, updated, errors, nextAfter }
 *
 * Upsert key: `hubspot_object_id`. Ensure-schema adds the column on
 * the first sync after a deploy if Payload's auto-migrate hasn't yet.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { isHubSpotEnabled, listConsultationRecords } from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import {
  ensureConsultationsSchema,
  runConsultationsPage,
  type DrizzleLike,
  type SqlRaw,
} from "@/lib/hubspot-sync-runners";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
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

function readRows(result: unknown): Array<{ id: number }> {
  if (Array.isArray(result)) return result as Array<{ id: number }>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<{ id: number }> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminOrCron(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
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

  const schema = await ensureConsultationsSchema(drizzle, sql);
  if (schema.error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hubspot:sync-consultations] schema-ensure failed:`,
      schema.error
    );
  }

  let hasObjectIdColumn = schema.alreadyHad || schema.added;
  if (!hasObjectIdColumn) {
    try {
      const colCheck = await drizzle.execute(
        sql.raw(
          `SELECT 1 FROM information_schema.columns
           WHERE table_name = 'consultations' AND column_name = 'hubspot_object_id'
           LIMIT 1;`
        )
      );
      hasObjectIdColumn = readRows(colCheck).length > 0;
    } catch {
      hasObjectIdColumn = false;
    }
  }

  const stats = await runConsultationsPage(
    drizzle,
    sql,
    fetched.data.results,
    { hasObjectIdColumn }
  );

  // eslint-disable-next-line no-console
  console.info(
    `[hubspot:sync-consultations] fetched=${fetched.data.results.length} inserted=${stats.inserted} updated=${stats.updated} errors=${stats.errors.length}`
  );

  return NextResponse.json({
    ok: true,
    fetched: fetched.data.results.length,
    inserted: stats.inserted,
    updated: stats.updated,
    errors: stats.errors.slice(0, 10),
    nextAfter: fetched.data.nextAfter,
    schemaAdded: schema.added || undefined,
  });
}
