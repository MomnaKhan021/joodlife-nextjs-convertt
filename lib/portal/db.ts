import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Raw SQL access for the patient portal, plus the portal's own tables.
 * Same drizzle-execute pattern as lib/accountData.ts. Values are escaped with
 * lit() because sql.raw is the only tagged form available here.
 */

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

export type Db = {
  query: (text: string) => Promise<Array<Record<string, unknown>>>;
};

export async function getDb(): Promise<Db> {
  const payload = await getPayloadInstance();
  const drizzle = (payload.db as unknown as { drizzle?: DrizzleLike }).drizzle;
  if (!drizzle?.execute) throw new Error("Database unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };
  return {
    async query(text: string) {
      const res = await drizzle.execute(sql.raw(text));
      if (Array.isArray(res)) return res as Array<Record<string, unknown>>;
      const rows = (res as { rows?: Array<Record<string, unknown>> })?.rows;
      return Array.isArray(rows) ? rows : [];
    },
  };
}

/** SQL literal: NULL, number, boolean, or a single-quoted string. */
export function lit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** A jsonb literal. */
export function jsonLit(v: unknown): string {
  return `${lit(JSON.stringify(v ?? null))}::jsonb`;
}

let ensured = false;

/**
 * The portal's own tables. Additive only (CREATE TABLE / ADD COLUMN IF NOT
 * EXISTS), created on first use like weight_logs, so nothing changes in the
 * database until the portal is used.
 */
export async function ensurePortalTables(db: Db): Promise<void> {
  if (ensured) return;
  const statements = [
    `CREATE TABLE IF NOT EXISTS "portal_prefs" (
      "user_id" integer PRIMARY KEY,
      "email" varchar NOT NULL,
      "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "portal_checkins" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "email" varchar NOT NULL,
      "svc" varchar NOT NULL DEFAULT 'wl',
      "mood" varchar,
      "effects" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "severe" boolean NOT NULL DEFAULT false,
      "note" text,
      "reply" text,
      "replied_by" varchar,
      "replied_at" timestamptz,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS portal_checkins_user_idx ON "portal_checkins" ("user_id", "created_at" DESC)`,
    `CREATE TABLE IF NOT EXISTS "portal_messages" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "email" varchar NOT NULL,
      "svc" varchar NOT NULL DEFAULT 'wl',
      "from_staff" boolean NOT NULL DEFAULT false,
      "author" varchar,
      "body" text NOT NULL,
      "read_by_patient_at" timestamptz,
      "read_by_staff_at" timestamptz,
      "created_at" timestamptz DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS portal_messages_user_idx ON "portal_messages" ("user_id", "created_at")`,
    `CREATE INDEX IF NOT EXISTS portal_messages_unread_idx ON "portal_messages" ("read_by_staff_at") WHERE "from_staff" = false`,
    // Failed-attempt counter for the emailed login code (codes reuse the
    // existing users.email_otp_hash / email_otp_expires columns).
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_otp_attempts" integer DEFAULT 0`,
  ];
  for (const s of statements) {
    try {
      await db.query(s);
    } catch (err) {
      console.error("[portal] schema statement failed:", (err as Error).message);
    }
  }
  ensured = true;
}

/** First non-null value among candidate column names (SELECT * rows). */
export function pick(r: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (k in r && r[k] != null) return r[k];
  return null;
}

export function asObject(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export function asArray(v: unknown): Array<Record<string, unknown>> {
  let x = v;
  if (typeof x === "string") {
    try {
      x = JSON.parse(x);
    } catch {
      return [];
    }
  }
  return Array.isArray(x) ? (x.filter((e) => e && typeof e === "object") as Array<Record<string, unknown>>) : [];
}

export function toIso(v: unknown): string | null {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
