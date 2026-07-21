/**
 * Admin self-test — exercises every dashboard query in one call and reports
 * pass/fail per check with the real error. Admin-gated.
 *
 *   GET /api/admin-tools/selftest
 *   → { ok, passed, failed, checks: [{ name, ok, ms, detail?, error? }] }
 *
 * Use it to verify the whole dashboard's data layer at once (every collection
 * list, the fulfilment filters, metrics, dispatch counts, clinical queue) —
 * anything red names the exact failing query.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

export async function GET(_req: NextRequest) {
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
  const role = (user as unknown as { role?: string })?.role;
  if (!user || (role !== "admin" && role !== "staff")) {
    return NextResponse.json({ ok: false, error: "Admin or staff role required" }, { status: 403 });
  }

  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle as DrizzleLike | undefined;
  if (!drizzle?.execute) {
    return NextResponse.json({ ok: false, error: "drizzle unavailable" }, { status: 500 });
  }
  const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };

  const rowsOf = (r: unknown): Array<Record<string, unknown>> =>
    Array.isArray(r) ? (r as Array<Record<string, unknown>>) : (((r as { rows?: unknown[] })?.rows ?? []) as Array<Record<string, unknown>>);

  // Every query the dashboard depends on. Each returns a count (or a small
  // result) so a failure surfaces the exact SQL/connection error.
  const CHECKS: Array<{ name: string; q: string }> = [
    { name: "orders — list", q: `SELECT COUNT(*)::int AS n FROM "orders"` },
    { name: "orders — To do filter", q: `SELECT COUNT(*)::int AS n FROM "orders" WHERE NOT (LOWER(status::text) IN ('shipped','delivered') OR COALESCE(CAST(notes AS TEXT),'') ILIKE '%DPD tracking:%') AND LOWER(status::text) <> 'cancelled'` },
    { name: "orders — Dispatched filter", q: `SELECT COUNT(*)::int AS n FROM "orders" WHERE (LOWER(status::text) IN ('shipped','delivered') OR COALESCE(CAST(notes AS TEXT),'') ILIKE '%DPD tracking:%')` },
    { name: "consultations — list", q: `SELECT COUNT(*)::int AS n FROM "consultations"` },
    { name: "consultations — metrics window", q: `SELECT COUNT(*)::int AS n FROM "consultations" WHERE created_at >= now() - interval '7 days'` },
    { name: "clinical queue — pending", q: `SELECT COUNT(*)::int AS n FROM "consultations" WHERE status IN ('submitted','reviewed')` },
    { name: "clinical queue — approved (dispatch pipeline)", q: `SELECT COUNT(*)::int AS n FROM "consultations" WHERE answers->>'_review_decision' = 'approved'` },
    { name: "products — list", q: `SELECT COUNT(*)::int AS n FROM "products"` },
    { name: "products — variants", q: `SELECT COUNT(*)::int AS n FROM "products_variants"` },
    { name: "products — images", q: `SELECT COUNT(*)::int AS n FROM "products_images"` },
    { name: "users / customers — list", q: `SELECT COUNT(*)::int AS n FROM "users"` },
    { name: "discounts — list", q: `SELECT COUNT(*)::int AS n FROM "discounts"` },
    { name: "posts / content — list", q: `SELECT COUNT(*)::int AS n FROM "posts"` },
    { name: "media — list", q: `SELECT COUNT(*)::int AS n FROM "media"` },
  ];

  const checks: Array<{ name: string; ok: boolean; ms: number; count?: number; error?: string }> = [];
  for (const c of CHECKS) {
    const start = Date.now();
    try {
      const res = await drizzle.execute(sql.raw(c.q));
      const n = Number(rowsOf(res)[0]?.n ?? 0);
      checks.push({ name: c.name, ok: true, ms: Date.now() - start, count: n });
    } catch (err) {
      checks.push({
        name: c.name,
        ok: false,
        ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const failed = checks.filter((c) => !c.ok);
  return NextResponse.json({
    ok: failed.length === 0,
    passed: checks.length - failed.length,
    failed: failed.length,
    checks,
  });
}
