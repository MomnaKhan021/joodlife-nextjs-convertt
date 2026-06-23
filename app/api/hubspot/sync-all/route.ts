/**
 * GET/POST /api/hubspot/sync-all
 *
 * One-shot sync that runs all three HubSpot pulls (contacts -> users,
 * deals -> orders, consultation custom-objects -> consultations).
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}` (so Vercel Cron
 * can call it on schedule). The actual sync work lives in
 * lib/hubspot-sync-all so the admin "Sync now" button can run it as a server
 * action instead of a client fetch (which was dropping the auth cookie).
 *
 * Function maxDuration: 300s.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isHubSpotEnabled } from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import { runHubSpotSyncAll } from "@/lib/hubspot-sync-all";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

async function handle(req: NextRequest) {
  const auth = await authorizeAdminOrCron(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" },
      { status: 400 },
    );
  }

  try {
    const result = await runHubSpotSyncAll();
    // eslint-disable-next-line no-console
    console.info("[hubspot:sync-all]", {
      via: auth.via,
      contacts: { pages: result.contacts.pages, inserted: result.contacts.inserted, updated: result.contacts.updated },
      orders: { pages: result.orders.pages, inserted: result.orders.inserted, updated: result.orders.updated },
      consultations: { pages: result.consultations.pages, inserted: result.consultations.inserted, updated: result.consultations.updated },
    });
    return NextResponse.json({ ok: true, via: auth.via, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Sync failed", detail: String(err) },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
