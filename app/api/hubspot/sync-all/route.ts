/**
 * GET/POST /api/hubspot/sync-all
 *
 * One-shot sync that runs all three HubSpot pulls (contacts, deals,
 * consultation custom-objects) end-to-end. Internally pages through
 * each individual /api/hubspot/sync-{contacts,orders,consultations}
 * endpoint, so the per-page upsert logic stays in one place.
 *
 * Auth: admin cookie OR `Authorization: Bearer ${CRON_SECRET}`
 * (so Vercel Cron can call it on schedule).
 *
 * Response shape:
 *   {
 *     ok: true,
 *     via: "admin" | "cron",
 *     contacts: { pages, fetched, inserted, updated, errors[] },
 *     orders:   { pages, fetched, inserted, updated, errors[] },
 *     consultations: { pages, fetched, inserted, updated, errors[] }
 *   }
 *
 * Page cap: 200 per type (= 20k records), 60s soft budget per type.
 * If you need more, run the per-type endpoint with explicit `after`.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isHubSpotEnabled } from "@/lib/hubspot";
import { authorizeAdminOrCron } from "@/lib/hubspot-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vercel Fluid Compute lets us run up to 300s; pick a comfortable
// upper bound so we can finish a full pull on a busy account.
export const maxDuration = 300;

type PageResult = {
  ok: boolean;
  fetched?: number;
  inserted?: number;
  updated?: number;
  errors?: string[];
  nextAfter?: string | null;
  error?: string;
  status?: number;
};

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

async function runOneType(
  baseUrl: string,
  path: string,
  forwardHeaders: Record<string, string>
): Promise<Totals> {
  const acc: Totals = { ...ZERO, errors: [] };
  let after: string | undefined = undefined;
  const start = Date.now();

  for (let page = 0; page < PAGE_CAP; page++) {
    if (Date.now() - start > PER_TYPE_BUDGET_MS) {
      acc.fatal = `time budget reached after ${page} pages`;
      break;
    }
    let json: PageResult;
    try {
      const res = await fetch(new URL(path, baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...forwardHeaders },
        body: JSON.stringify({ limit: 100, after }),
      });
      json = (await res.json()) as PageResult;
      if (!res.ok || !json.ok) {
        acc.fatal =
          json.error ??
          `HTTP ${res.status}${json.status ? ` · HubSpot ${json.status}` : ""}`;
        break;
      }
    } catch (err) {
      acc.fatal = err instanceof Error ? err.message : String(err);
      break;
    }

    acc.pages += 1;
    acc.fetched += json.fetched ?? 0;
    acc.inserted += json.inserted ?? 0;
    acc.updated += json.updated ?? 0;
    if (json.errors?.length) acc.errors.push(...json.errors);

    if (!json.nextAfter) break;
    after = json.nextAfter;
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

  // Forward whichever auth signal the caller used. For an admin
  // session that's the cookie; for cron that's the Bearer header.
  const forward: Record<string, string> = {};
  const cookie = req.headers.get("cookie");
  if (cookie) forward.cookie = cookie;
  const authHeader = req.headers.get("authorization");
  if (authHeader) forward.authorization = authHeader;
  // Keep cron calls cron-flavoured even after the loopback hop.
  const cronMark = req.headers.get("x-vercel-cron");
  if (cronMark) forward["x-vercel-cron"] = cronMark;

  // Use the absolute URL of *this* request as the base for loopback
  // calls — works on every Vercel deployment without configuration.
  const baseUrl = new URL(req.url).origin;

  // Sync contacts first so order/consultation user_id linking can
  // find newly-imported users.
  const contacts = await runOneType(
    baseUrl,
    "/api/hubspot/sync-contacts",
    forward
  );
  const orders = await runOneType(
    baseUrl,
    "/api/hubspot/sync-orders",
    forward
  );
  const consultations = await runOneType(
    baseUrl,
    "/api/hubspot/sync-consultations",
    forward
  );

  // eslint-disable-next-line no-console
  console.info("[hubspot:sync-all]", {
    via: auth.via,
    contacts: { pages: contacts.pages, inserted: contacts.inserted, updated: contacts.updated },
    orders: { pages: orders.pages, inserted: orders.inserted, updated: orders.updated },
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
