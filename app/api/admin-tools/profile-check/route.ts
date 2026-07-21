/**
 * Admin-only diagnostic for the "My account" (/profile) page.
 *
 * The profile page deliberately swallows errors (so it never hard-crashes),
 * which also hides *why* it might show no data. This endpoint runs the same
 * lookups with errors surfaced, so we can see exactly what's happening for
 * the signed-in account. Visit it while signed in as an admin.
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

function toRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<Record<string, unknown>> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export async function GET() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as { role?: string }).role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  const email = (user as { email?: string }).email ?? "";
  const safe = email.trim().toLowerCase().replace(/'/g, "''");

  const drizzle = (
    payload.db as unknown as { drizzle?: DrizzleLike }
  ).drizzle;
  const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };

  async function probe(label: string, query: string) {
    if (!drizzle?.execute) return { label, error: "no drizzle" };
    try {
      const res = await drizzle.execute(sql.raw(query));
      const rows = toRows(res);
      return {
        label,
        ok: true,
        count: rows.length,
        columns: rows[0] ? Object.keys(rows[0]) : [],
      };
    } catch (err) {
      return { label, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const checks = await Promise.all([
    probe(
      "orders",
      `SELECT * FROM "orders" WHERE lower(customer_email) = '${safe}' ORDER BY created_at DESC LIMIT 50`,
    ),
    probe(
      "consultations",
      `SELECT * FROM "consultations" WHERE lower(email) = '${safe}' ORDER BY created_at DESC LIMIT 50`,
    ),
  ]);

  return NextResponse.json({
    ok: checks.every((c) => c.ok),
    signedInAs: { email, role: (user as { role?: string }).role, name: (user as { name?: string }).name },
    checks,
  });
}
