/**
 * POST /api/hubspot/sync-contacts
 * Admin-or-CRON. Pulls contacts from HubSpot in pages and upserts
 * them into our `users` table. Existing rows (matched by email) get
 * name and phone updated; new rows are inserted as customers with a
 * random hash (the customer must use the password-reset flow to
 * claim the account).
 *
 *   Body (optional): { limit?: number, after?: string }
 *   Returns:        { ok, fetched, inserted, updated, errors, nextAfter }
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { isHubSpotEnabled, listContacts } from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import {
  runContactsPage,
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

  const fetched = await listContacts(body.after, limit);
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

  const stats = await runContactsPage(drizzle, sql, fetched.data.results);

  // eslint-disable-next-line no-console
  console.info(
    `[hubspot:sync-contacts] fetched=${fetched.data.results.length} inserted=${stats.inserted} updated=${stats.updated} errors=${stats.errors.length}`
  );

  return NextResponse.json({
    ok: true,
    fetched: fetched.data.results.length,
    inserted: stats.inserted,
    updated: stats.updated,
    errors: stats.errors.slice(0, 10),
    nextAfter: fetched.data.nextAfter,
  });
}
