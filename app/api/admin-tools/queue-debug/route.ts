/**
 * GET /api/admin-tools/queue-debug   (admin/staff only)
 *
 * Read-only ground-truth for "why isn't my new order / consultation showing".
 * Ignores the legacy-data hide so it reports EVERYTHING, and flags for each
 * row whether it is after the hide cutoff and (for consultations) whether a
 * matching order exists — which is what decides Clinical Check vs Abandoned
 * Checkout. Nothing is modified.
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { HIDE_BEFORE } from "@/lib/adminHide";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

export async function GET(req: Request) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle as DrizzleLike;
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  const cut = HIDE_BEFORE ?? null;
  const cutExpr = cut ? `'${cut}'::timestamptz` : "NULL::timestamptz";

  // ?email=<addr> → probe the live HubSpot meeting lookup for that patient, to
  // see exactly what we get back (contact found? meeting start time? join URL?).
  const probeEmail = new URL(req.url).searchParams.get("email");
  if (probeEmail) {
    try {
      const { getMeetingLinkForContact, isHubSpotEnabled } = await import("@/lib/hubspot");
      const enabled = isHubSpotEnabled();
      const res = enabled ? await getMeetingLinkForContact(probeEmail.trim().toLowerCase()) : null;
      return NextResponse.json({ ok: true, email: probeEmail, hubspotEnabled: enabled, meetingLookup: res });
    } catch (err) {
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
  }

  const DISP =
    "(LOWER(COALESCE(status::text,'')) IN ('shipped','delivered') OR COALESCE(CAST(notes AS TEXT),'') ILIKE '%DPD tracking:%')";

  try {
    const { isHubSpotEnabled } = await import("@/lib/hubspot");
    const [now, orders, consults, totals] = await Promise.all([
      drizzle.execute(sql.raw(`SELECT now() AS server_time, ${cutExpr} AS cutoff`)),
      drizzle.execute(
        sql.raw(`
          SELECT id, order_number, customer_email, status, total_amount, created_at,
                 (created_at >= ${cutExpr}) AS after_cutoff,
                 ${DISP} AS is_dispatched,
                 CASE WHEN ${DISP} THEN 'Dispatched'
                      WHEN LOWER(COALESCE(status::text,'')) = 'cancelled' THEN 'Cancelled'
                      ELSE 'Orders (to-do)' END AS orders_tab
            FROM orders ORDER BY id DESC LIMIT 10`),
      ),
      drizzle.execute(
        sql.raw(`
          SELECT id, email, status, product_slug, created_at,
                 (created_at >= ${cutExpr}) AS after_cutoff,
                 (answers->>'_review_decision') AS review_decision,
                 (answers->>'_dispatched_at') AS dispatched_at,
                 CASE
                   WHEN (answers->>'_review_decision') = 'approved' AND (answers->>'_dispatched_at') IS NOT NULL THEN 'Dispatched'
                   WHEN (answers->>'_review_decision') = 'approved' THEN 'To Dispatch'
                   WHEN status IN ('submitted','reviewed') THEN 'Clinical Check / Abandoned'
                   ELSE status
                 END AS queue,
                 EXISTS (SELECT 1 FROM orders o WHERE LOWER(o.customer_email) = LOWER("consultations".email)) AS has_order
            FROM consultations ORDER BY id DESC LIMIT 10`),
      ),
      drizzle.execute(
        sql.raw(`
          SELECT
            (SELECT COUNT(*)::int FROM orders) AS orders_total,
            (SELECT COUNT(*)::int FROM orders WHERE created_at >= ${cutExpr}) AS orders_after_cutoff,
            (SELECT COUNT(*)::int FROM consultations) AS consults_total,
            (SELECT COUNT(*)::int FROM consultations WHERE created_at >= ${cutExpr}) AS consults_after_cutoff,
            (SELECT COUNT(*)::int FROM consultations c
               WHERE c.status IN ('submitted','reviewed')
                 AND c.email IS NOT NULL
                 AND c.created_at >= ${cutExpr}
                 AND EXISTS (SELECT 1 FROM orders o WHERE LOWER(o.customer_email) = LOWER(c.email))
            ) AS clinical_visible,
            (SELECT COUNT(*)::int FROM abandoned_carts WHERE recovered_at IS NULL AND created_at >= ${cutExpr}) AS carts_visible`),
      ),
    ]);

    return NextResponse.json({
      ok: true,
      hubspotEnabled: isHubSpotEnabled(),
      cutoff: cut,
      now: rowsOf(now)[0],
      totals: rowsOf(totals)[0],
      latestOrders: rowsOf(orders),
      latestConsultations: rowsOf(consults),
      note: "A consultation shows in Clinical Check only when after_cutoff=true, status is submitted/reviewed, AND has_order=true (same email). Otherwise it's in Abandoned Checkout.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
