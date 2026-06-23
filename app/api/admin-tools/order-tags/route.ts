/**
 * Admin order tags — POST /api/admin-tools/order-tags  { orderId, tags: string[] }
 *
 * Admin-only. Persists order tags. The orders table has no tags column by
 * default, so we add it idempotently (ADD COLUMN IF NOT EXISTS) and store a
 * comma-separated string. The order page reads it back via the record API.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  let body: { orderId?: number | string; tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const orderId = Number(body.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid orderId" }, { status: 400 });
  }
  // Sanitise tags → clean comma-separated string.
  const tags = Array.isArray(body.tags)
    ? [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 30)
    : [];
  const value = tags.join(",").replace(/'/g, "''").slice(0, 1000);

  try {
    const { drizzle, sql } = await getDrizzle();
    await drizzle.execute(sql.raw(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS tags text`));
    await drizzle.execute(
      sql.raw(`UPDATE "orders" SET tags = '${value}', updated_at = now() WHERE id = ${orderId}`),
    );
    return NextResponse.json({ ok: true, tags });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
