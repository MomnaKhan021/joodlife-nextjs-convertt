/**
 * Dispatch note — POST /api/admin-tools/dispatch-note  { orderId, note }
 *
 * A note is COMPULSORY before a parcel can be dispatched: staff record what
 * they are sending (e.g. how many packs/tabs, batch remarks) against the order.
 * The To Dispatch card autosaves through here as they type, and the
 * "Print dispatch label" button stays disabled until a note exists.
 *
 * The orders table has no dispatch_note column by default, so we add it
 * idempotently (ADD COLUMN IF NOT EXISTS) — same pattern as order-tags.
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
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json(
      { ok: false, error: "Admin or staff role required" },
      { status: 403 },
    );
  }

  let body: { orderId?: number | string; note?: unknown };
  try {
    body = (await req.json()) as { orderId?: number | string; note?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = Number(body.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid orderId" }, { status: 400 });
  }

  // Collapse whitespace (incl. newlines/tabs) and clamp the length.
  const note = String(body.note ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);

  try {
    const { drizzle, sql } = await getDrizzle();
    await drizzle.execute(
      sql.raw(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS dispatch_note text`),
    );
    await drizzle.execute(
      sql.raw(
        `UPDATE "orders"
         SET dispatch_note = ${note ? `'${note.replace(/'/g, "''")}'` : "NULL"},
             updated_at = now()
         WHERE id = ${orderId}`,
      ),
    );
    return NextResponse.json({ ok: true, note });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
