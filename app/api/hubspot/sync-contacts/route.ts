/**
 * POST /api/hubspot/sync-contacts
 * Admin-only. Pulls contacts from HubSpot in pages and upserts them
 * into our `users` table. Existing rows (matched by email) are
 * updated with HubSpot's name/phone; new rows are inserted with
 * role=customer and a random hash (no password — they'll need to
 * use the password-reset flow to claim the account).
 *
 *   Body (optional): { limit?: number, after?: string }
 *   Returns:        { ok, fetched, inserted, updated, errors, nextAfter }
 *
 * Re-call with the returned `nextAfter` to fetch the next page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";
import crypto from "crypto";

import { getPayloadInstance } from "@/lib/payload";
import { isHubSpotEnabled, listContacts } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: SqlRaw;
}> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: SqlRaw;
  };
  return { drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";
}

function readRows(result: unknown): Array<{ id: number }> {
  if (Array.isArray(result)) return result as Array<{ id: number }>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<{ id: number }> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" },
      { status: 400 }
    );
  }

  let body: { limit?: number; after?: string };
  try {
    body = (await req.json()) as { limit?: number; after?: string };
  } catch {
    body = {};
  }
  const limit = Math.min(Math.max(Number(body.limit ?? 100), 1), 100);

  const fetched = await listContacts(body.after, limit);
  if (!fetched.ok) {
    return NextResponse.json(
      { ok: false, status: fetched.status, error: fetched.error },
      { status: 502 }
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

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const c of fetched.data.results) {
    const email = c.properties.email;
    if (!email) continue;
    const firstName = c.properties.firstname ?? "";
    const lastName = c.properties.lastname ?? "";
    const phone = c.properties.phone ?? null;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    try {
      // Try UPDATE first; if no rows updated, fall through to INSERT.
      const updateStmt = `
        UPDATE "users"
        SET name = ${esc(fullName || email.split("@")[0])},
            phone = COALESCE(${esc(phone)}, phone),
            updated_at = now()
        WHERE email = ${esc(email)}
        RETURNING id;
      `;
      const updateRes = await drizzle.execute(sql.raw(updateStmt));
      if (readRows(updateRes).length > 0) {
        updated++;
        continue;
      }

      // Random hash — Payload uses pbkdf2 internally so this is just
      // a placeholder. The customer must use the password-reset flow
      // to set a real one.
      const hash = crypto.randomBytes(32).toString("hex");
      const salt = crypto.randomBytes(16).toString("hex");
      const insertStmt = `
        INSERT INTO "users"
          (name, email, role, hash, salt, phone, updated_at, created_at)
        VALUES
          (${esc(fullName || email.split("@")[0])}, ${esc(email)},
           'customer', ${esc(hash)}, ${esc(salt)}, ${esc(phone)},
           now(), now())
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `;
      const insertRes = await drizzle.execute(sql.raw(insertStmt));
      if (readRows(insertRes).length > 0) inserted++;
    } catch (err) {
      errors.push(
        `${email}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: fetched.data.results.length,
    inserted,
    updated,
    errors: errors.slice(0, 10),
    nextAfter: fetched.data.nextAfter,
  });
}
