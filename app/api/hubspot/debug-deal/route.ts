/**
 * GET /api/hubspot/debug-deal?id=<hubspotDealId>
 * Admin-only. Walks the orders sync for a single deal and returns:
 *   - the raw HubSpot deal payload (so we can see what properties exist)
 *   - the values we'd map to each DB column
 *   - the actual SQL we'd execute
 *   - the columns the orders table currently has + their types
 *   - any error thrown during the trial UPSERT (rolled back at the end)
 *
 * Use when /api/hubspot/sync-orders reports rows-failed-with-errors
 * and the operator needs to know exactly which column or constraint
 * is rejecting the data.
 *
 * If `?id` is omitted, picks the first deal HubSpot returns.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isHubSpotEnabled, listDeals, getContactById } from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

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

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export async function GET(req: NextRequest) {
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

  const dealIdParam = new URL(req.url).searchParams.get("id") ?? null;

  // Fetch the first page; pick either the requested deal or the first
  const page = await listDeals(undefined, 100);
  if (!page.ok) {
    return NextResponse.json(
      { ok: false, error: page.error, status: page.status },
      { status: 502 }
    );
  }
  const deal = dealIdParam
    ? page.data.results.find((d) => d.id === dealIdParam)
    : page.data.results[0];
  if (!deal) {
    return NextResponse.json({
      ok: false,
      error: dealIdParam
        ? `Deal ${dealIdParam} not found in first 100 results`
        : "No deals returned by HubSpot",
      pageSize: page.data.results.length,
    });
  }

  // Optionally hydrate the contact for fuller debugging
  let contact: unknown = null;
  if (deal.contactId) {
    const c = await getContactById(deal.contactId);
    contact = c.ok ? c.data : { error: c.error };
  }

  // Inspect the orders table schema so we can compare to the columns
  // we're about to insert into.
  let columns: Array<{ column_name: string; data_type: string; is_nullable: string }> = [];
  let trialError: string | null = null;
  let alreadyExists: boolean = false;
  try {
    const { drizzle, sql } = await getDrizzle();
    const colRes = await drizzle.execute(
      sql.raw(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name = 'orders'
         ORDER BY ordinal_position;`
      )
    );
    columns = readRows(colRes);

    // Run the trial INSERT inside a transaction, rolled back at the end
    // so we don't actually mutate the DB. This lets us surface the exact
    // SQL error without the upsert appearing in the orders table.
    const p = deal.properties;
    const orderNumber =
      (p.jood_order_number ?? "").trim() ||
      (p.dealname ?? "").trim() ||
      `HS-${deal.id}`;

    const exists = await drizzle.execute(
      sql.raw(
        `SELECT id FROM "orders" WHERE order_number = '${orderNumber.replace(/'/g, "''")}' LIMIT 1;`
      )
    );
    alreadyExists = readRows(exists).length > 0;
  } catch (err) {
    trialError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    ok: true,
    via: auth.via,
    deal: {
      id: deal.id,
      properties: deal.properties,
      contactId: deal.contactId ?? null,
      contactEmail: deal.contactEmail ?? null,
      contact,
    },
    schema: {
      orders: columns,
      hasHubspotDealIdColumn: columns.some(
        (c) => c.column_name === "hubspot_deal_id"
      ),
    },
    trial: {
      orderNumberWeWouldUse:
        (deal.properties.jood_order_number ?? "").trim() ||
        (deal.properties.dealname ?? "").trim() ||
        `HS-${deal.id}`,
      alreadyExistsInOrdersTable: alreadyExists,
      schemaInspectError: trialError,
    },
  });
}
