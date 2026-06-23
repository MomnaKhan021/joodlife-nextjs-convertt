import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import {
  listContacts,
  listDeals,
  listConsultationRecords,
} from "@/lib/hubspot";
import {
  ensureConsultationsSchema,
  ensureOrdersSchema,
  runConsultationsPage,
  runContactsPage,
  runDealsPage,
  type DrizzleLike,
  type SqlRaw,
} from "@/lib/hubspot-sync-runners";

/**
 * Core "pull everything from HubSpot" routine, shared by:
 *   - the Vercel cron route (/api/hubspot/sync-all), authed via CRON_SECRET
 *   - the admin "Sync now" server action, authed via the admin session
 *
 * Keeping the work here (not in the route) means the admin button can invoke
 * it as a server action — which runs inside the authenticated request and
 * never depends on the browser re-sending the auth cookie on a client fetch
 * (the cause of the "session cookie missing" errors on the button).
 */

export type Totals = {
  pages: number;
  fetched: number;
  inserted: number;
  updated: number;
  errors: string[];
  fatal?: string;
};

export type SyncAllResult = {
  contacts: Totals;
  orders: Totals;
  consultations: Totals;
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

async function runContacts(drizzle: DrizzleLike, sql: SqlRaw): Promise<Totals> {
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

async function runOrders(drizzle: DrizzleLike, sql: SqlRaw): Promise<Totals> {
  const acc: Totals = { ...ZERO, errors: [] };
  const schema = await ensureOrdersSchema(drizzle, sql);
  if (schema.error) acc.errors.push(`schema: ${schema.error}`);
  let hasDealIdColumn = schema.alreadyHad || schema.added;
  if (!hasDealIdColumn) {
    try {
      const colCheck = await drizzle.execute(
        sql.raw(
          `SELECT 1 FROM information_schema.columns
           WHERE table_name = 'orders' AND column_name = 'hubspot_deal_id'
           LIMIT 1;`,
        ),
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
  sql: SqlRaw,
): Promise<Totals> {
  const acc: Totals = { ...ZERO, errors: [] };
  const schema = await ensureConsultationsSchema(drizzle, sql);
  if (schema.error) acc.errors.push(`schema: ${schema.error}`);
  let hasObjectIdColumn = schema.alreadyHad || schema.added;
  if (!hasObjectIdColumn) {
    try {
      const colCheck = await drizzle.execute(
        sql.raw(
          `SELECT 1 FROM information_schema.columns
           WHERE table_name = 'consultations' AND column_name = 'hubspot_object_id'
           LIMIT 1;`,
        ),
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

/** Run all three pulls sequentially. Throws only on DB-init failure. */
export async function runHubSpotSyncAll(): Promise<SyncAllResult> {
  const { drizzle, sql } = await getDrizzle();
  const contacts = await runContacts(drizzle, sql);
  const orders = await runOrders(drizzle, sql);
  const consultations = await runConsultations(drizzle, sql);
  return { contacts, orders, consultations };
}
