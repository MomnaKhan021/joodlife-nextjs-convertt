/**
 * GET/POST /api/hubspot/sync-all
 *
 * One-shot sync that runs all three HubSpot pulls (contacts -> users,
 * deals -> orders, consultation custom-objects -> consultations)
 * end-to-end in a single function invocation.
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}` (so
 * Vercel Cron can call it on schedule).
 *
 * Implementation note: this used to fan out to the per-type
 * /api/hubspot/sync-* endpoints via internal fetch, but the
 * forwarded admin cookie was being dropped on the loopback hop on
 * Vercel — every inner call returned "Admin role or CRON_SECRET
 * required". Now we call the lib/hubspot-sync-runners helpers
 * directly so the auth check happens once here and the inner work
 * never crosses an HTTP boundary.
 *
 * Page cap per type: 200 (= 20k records). Per-type wall-clock
 * budget: 90s. Function maxDuration: 300s.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import {
  isHubSpotEnabled,
  listContacts,
  listDeals,
  listConsultationRecords,
} from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import {
  ensureConsultationsSchema,
  ensureOrdersSchema,
  runConsultationsPage,
  runContactsPage,
  runDealsPage,
  type DrizzleLike,
  type SqlRaw,
} from "@/lib/hubspot-sync-runners";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type Totals = {
  pages: number;
  fetched: number;
  inserted: number;
  updated: number;
  errors: string[];
  fatal?: string;
};

const ZERO: Totals = { pages: 0, fetched: 0, inserted: 0, updated: 0, errors: [] };

const PAGE_CAP = 200;
const PER_TYPE_BUDGET_MS = 90_000;

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

function readRows(result: unknown): Array<{ id: number }> {
  if (Array.isArray(result)) return result as Array<{ id: number }>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<{ id: number }> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

async function runContacts(
  drizzle: DrizzleLike,
  sql: SqlRaw
): Promise<Totals> {
  const acc: Totals = { ...ZERO, errors: [] };
  let after: string | undefined = undefined;
  const start = Date.now();
  for (let page = 0; page < PAGE_CAP; page++) {
    if (Date.now() - start > PER_TYPE_BUDGET_MS) {
      acc.fatal = `time budget reached after ${page} pages`;
      break;
    }
    const fetched = await listContacts(after, 100);
    if (!fetched.ok) {
      acc.fatal = `HubSpot contacts: ${fetched.error} (HTTP ${fetched.status})`;
      break;
    }
    const stats = await runContactsPage(drizzle, sql, fetched.data.results);
    acc.pages += 1;
    acc.fetched += fetched.data.results.length;
    acc.inserted += stats.inserted;
    acc.updated += stats.updated;
    if (stats.errors.length) acc.errors.push(...stats.errors);
    if (!fetched.data.nextAfter) break;
    after = fetched.data.nextAfter;
  }
  return acc;
}

async function runOrders(
  drizzle: DrizzleLike,
  sql: SqlRaw
): Promise<Totals> {
  const acc: Totals = { ...ZERO, errors: [] };
  // Ensure schema once for the whole run
  const schema = await ensureOrdersSchema(drizzle, sql);
  if (schema.error) {
    acc.errors.push(`schema: ${schema.error}`);
  }
  let hasDealIdColumn = schema.alreadyHad || schema.added;
  if (!hasDealIdColumn) {
    try {
      const colCheck = await drizzle.execute(
        sql.raw(
          `SELECT 1 FROM information_schema.columns
           WHERE table_name = 'orders' AND column_name = 'hubspot_deal_id'
           LIMIT 1;`
        )
      );
      hasDealIdColumn = readRows(colCheck).length > 0;
    } catch {
      hasDealIdColumn = false;
    }
  }

  let after: string | undefined = undefined;
  const start = Date.now();
  for (let page = 0; page < PAGE_CAP; page++) {
    if (Date.now() - start > PER_TYPE_BUDGET_MS) {
      acc.fatal = `time budget reached after ${page} pages`;
      break;
    }
    const fetched = await listDeals(after, 100);
    if (!fetched.ok) {
      acc.fatal = `HubSpot deals: ${fetched.error} (HTTP ${fetched.status})`;
      break;
    }
    const stats = await runDealsPage(drizzle, sql, fetched.data.results, {
      hasDealIdColumn,
    });
    acc.pages += 1;
    acc.fetched += fetched.data.results.length;
    acc.inserted += stats.inserted;
    acc.updated += stats.updated;
    if (stats.errors.length) acc.errors.push(...stats.errors);
    if (!fetched.data.nextAfter) break;
    after = fetched.data.nextAfter;
  }
  return acc;
}

async function runConsultations(
  drizzle: DrizzleLike,
  sql: SqlRaw
): Promise<Totals> {
  const acc: Totals = { ...ZERO, errors: [] };
  const schema = await ensureConsultationsSchema(drizzle, sql);
  if (schema.error) {
    acc.errors.push(`schema: ${schema.error}`);
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

  let after: string | undefined = undefined;
  const start = Date.now();
  for (let page = 0; page < PAGE_CAP; page++) {
    if (Date.now() - start > PER_TYPE_BUDGET_MS) {
      acc.fatal = `time budget reached after ${page} pages`;
      break;
    }
    const fetched = await listConsultationRecords(after, 100);
    if (!fetched.ok) {
      // Soft-fail consultations: if the custom object isn't configured
      // in HubSpot, surface the error in fatal but don't crash the
      // whole sync-all (orders/contacts can still finish).
      acc.fatal = `HubSpot consultations: ${fetched.error} (HTTP ${fetched.status})`;
      break;
    }
    const stats = await runConsultationsPage(drizzle, sql, fetched.data.results, {
      hasObjectIdColumn,
    });
    acc.pages += 1;
    acc.fetched += fetched.data.results.length;
    acc.inserted += stats.inserted;
    acc.updated += stats.updated;
    if (stats.errors.length) acc.errors.push(...stats.errors);
    if (!fetched.data.nextAfter) break;
    after = fetched.data.nextAfter;
  }
  return acc;
}

async function handle(req: NextRequest) {
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

  // Run all three types sequentially. Each is bounded by its own
  // time budget so a slow one doesn't starve the others.
  const contacts = await runContacts(drizzle, sql);
  const orders = await runOrders(drizzle, sql);
  const consultations = await runConsultations(drizzle, sql);

  // eslint-disable-next-line no-console
  console.info("[hubspot:sync-all]", {
    via: auth.via,
    contacts: {
      pages: contacts.pages,
      inserted: contacts.inserted,
      updated: contacts.updated,
    },
    orders: {
      pages: orders.pages,
      inserted: orders.inserted,
      updated: orders.updated,
    },
    consultations: {
      pages: consultations.pages,
      inserted: consultations.inserted,
      updated: consultations.updated,
    },
  });

  return NextResponse.json({
    ok: true,
    via: auth.via,
    contacts,
    orders,
    consultations,
  });
}

export const GET = handle;
export const POST = handle;
