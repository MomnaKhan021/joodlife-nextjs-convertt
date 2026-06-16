import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Ensure the `weight_logs` table exists.
 *
 * Payload's Postgres adapter only auto-creates schema (`push`) when
 * NODE_ENV !== "production" (see @payloadcms/db-postgres connect.js), and
 * this project has no migrations wired up — so a newly-added collection's
 * table is never created on the live (Vercel) database. Without this, the
 * first weight save 500s with `relation "weight_logs" does not exist`.
 *
 * This runs the exact DDL Payload generates for the collection (verified
 * against a dev push), idempotently (IF NOT EXISTS), once per server
 * instance. Safe to call on every write.
 */
let weightLogsTableEnsured = false;
export async function ensureWeightLogsTable(): Promise<void> {
  if (weightLogsTableEnsured) return;
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle as { execute: (q: unknown) => Promise<unknown> } | undefined;
  if (!drizzle?.execute) return;
  const { sql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };

  // Table first (critical — let failures surface to the caller).
  await drizzle.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "weight_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "customer_email" varchar NOT NULL,
        "weight_kg" numeric NOT NULL,
        "logged_at" timestamp(3) with time zone NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `),
  );

  // FK + indexes are best-effort (idempotent; never block a save).
  const extras = [
    `DO $$ BEGIN
       ALTER TABLE "weight_logs"
         ADD CONSTRAINT "weight_logs_user_id_users_id_fk"
         FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
     EXCEPTION WHEN others THEN null; END $$`,
    `CREATE INDEX IF NOT EXISTS "weight_logs_user_idx" ON "weight_logs" ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "weight_logs_customer_email_idx" ON "weight_logs" ("customer_email")`,
    `CREATE INDEX IF NOT EXISTS "weight_logs_updated_at_idx" ON "weight_logs" ("updated_at")`,
    `CREATE INDEX IF NOT EXISTS "weight_logs_created_at_idx" ON "weight_logs" ("created_at")`,
  ];
  for (const stmt of extras) {
    try {
      await drizzle.execute(sql.raw(stmt));
    } catch {
      // ignore — table is what matters for writes
    }
  }
  weightLogsTableEnsured = true;
}

/**
 * Weight-log history for a signed-in user.
 *
 * Source of truth is the `consultations` table — every consultation the
 * customer submits captures `current_weight_kg` (and height for BMI) in
 * its `answers` JSON. The same records are mirrored to HubSpot, so this
 * is the local view of the data the dashboard syncs there. We match on
 * the customer's email so a person sees their own entries over time.
 */

export type WeightLogEntry = {
  /** Consultation id the entry came from. */
  id: number;
  /** ISO timestamp the consultation was created. */
  date: string;
  /** Current weight in kg, if captured. */
  weightKg: number | null;
  /** Height in cm, if captured (used for BMI). */
  heightCm: number | null;
  /** BMI derived from weight + height, rounded to 1 dp. */
  bmi: number | null;
  /** "draft" | "submitted" | "logged". */
  status: string | null;
  /** Where this point came from: a consultation or a manual weight log. */
  source?: "consultation" | "log";
};

/** A single change-vs-previous indicator. */
export type WeightChange = {
  /** kg difference vs the previous entry (positive = gain, negative = loss). */
  deltaKg: number;
  direction: "gained" | "lost" | "same";
  /** Human label e.g. "+2 kg gained", "-1.5 kg lost", "No change". */
  label: string;
};

export type WeightLogSummary = {
  email: string;
  entries: WeightLogEntry[];
  /** Earliest weight on record. */
  startWeightKg: number | null;
  /** Most recent weight on record. */
  latestWeightKg: number | null;
  /** latest − start (negative = loss). */
  changeKg: number | null;
  latestBmi: number | null;
  /** Change of the latest entry vs the one immediately before it. */
  latestChange: WeightChange | null;
};

/** Build a human-readable change indicator from a kg delta. */
export function describeChange(deltaKg: number): WeightChange {
  const rounded = Math.round(deltaKg * 10) / 10;
  if (rounded > 0) {
    return { deltaKg: rounded, direction: "gained", label: `+${rounded} kg gained` };
  }
  if (rounded < 0) {
    return {
      deltaKg: rounded,
      direction: "lost",
      label: `${rounded} kg lost`,
    };
  }
  return { deltaKg: 0, direction: "same", label: "No change" };
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function bmiFrom(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  return Number.isFinite(bmi) ? Math.round(bmi * 10) / 10 : null;
}

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

export async function getWeightLogsForEmail(
  email: string,
): Promise<WeightLogSummary> {
  const empty: WeightLogSummary = emptySummary(email);
  const clean = email?.trim().toLowerCase();
  if (!clean) return empty;

  let rows: Array<Record<string, unknown>> = [];
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle as DrizzleLike | undefined;
    if (!drizzle?.execute) return empty;
    const { sql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const safe = clean.replace(/'/g, "''");
    const result = (await drizzle.execute(
      sql.raw(`
        SELECT id, answers, status, created_at
        FROM "consultations"
        WHERE lower(email) = '${safe}'
        ORDER BY created_at ASC
      `),
    )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    rows = Array.isArray(result) ? result : (result.rows ?? []);
  } catch {
    return empty;
  }

  const entries: WeightLogEntry[] = [];
  for (const r of rows) {
    let answers: Record<string, unknown> = {};
    const raw = r.answers;
    if (raw && typeof raw === "object") answers = raw as Record<string, unknown>;
    else if (typeof raw === "string") {
      try {
        answers = JSON.parse(raw);
      } catch {
        answers = {};
      }
    }
    const weightKg = num(answers.current_weight_kg ?? answers.weight ?? answers.current_weight);
    const heightCm = num(answers.height_cm ?? answers.height);
    // Only keep rows that actually recorded a weight.
    if (weightKg === null) continue;
    entries.push({
      id: Number(r.id),
      date: r.created_at ? new Date(r.created_at as string).toISOString() : new Date().toISOString(),
      weightKg,
      heightCm,
      bmi: bmiFrom(weightKg, heightCm),
      status: (r.status as string) ?? null,
      source: "consultation",
    });
  }

  return summarize(clean, entries);
}

/** Empty summary shell. */
function emptySummary(email: string): WeightLogSummary {
  return {
    email,
    entries: [],
    startWeightKg: null,
    latestWeightKg: null,
    changeKg: null,
    latestBmi: null,
    latestChange: null,
  };
}

/**
 * Given chronologically-sorted entries, fill BMI (carrying the most recent
 * known height forward so manual logs without a height still get a BMI) and
 * compute the start/latest/total-change/latest-BMI plus the latest-vs-previous
 * change indicator.
 */
function summarize(email: string, sorted: WeightLogEntry[]): WeightLogSummary {
  if (sorted.length === 0) return emptySummary(email);

  // Carry the last known height forward to derive BMI for later points.
  let lastHeight: number | null = null;
  for (const e of sorted) {
    if (e.heightCm !== null) lastHeight = e.heightCm;
    else if (lastHeight !== null) e.bmi = bmiFrom(e.weightKg, lastHeight);
  }

  const weights = sorted
    .map((e) => e.weightKg)
    .filter((n): n is number => n !== null);
  const startWeightKg = weights.length ? weights[0] : null;
  const latestWeightKg = weights.length ? weights[weights.length - 1] : null;
  const changeKg =
    startWeightKg !== null && latestWeightKg !== null
      ? Math.round((latestWeightKg - startWeightKg) * 10) / 10
      : null;
  const latestBmi = sorted[sorted.length - 1].bmi;

  let latestChange: WeightChange | null = null;
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1].weightKg;
    const prev = sorted[sorted.length - 2].weightKg;
    if (last !== null && prev !== null) latestChange = describeChange(last - prev);
  }

  return {
    email,
    entries: sorted,
    startWeightKg,
    latestWeightKg,
    changeKg,
    latestBmi,
    latestChange,
  };
}

/**
 * Combined weight history for a user: manual weight-log entries
 * (POST /api/weight-logs) merged with weights captured in consultations,
 * sorted oldest→newest. This is the source for the account chart/summary.
 */
export async function getCombinedWeightLogs(
  email: string,
): Promise<WeightLogSummary> {
  const clean = email?.trim().toLowerCase();
  if (!clean) return emptySummary(email);

  // Consultation-derived weights (reuses the existing reader).
  const consult = await getWeightLogsForEmail(clean);

  // Manual weight-log entries from the dedicated table.
  const manual: WeightLogEntry[] = [];
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle as DrizzleLike | undefined;
    if (drizzle?.execute) {
      const { sql } = (await import("drizzle-orm")) as {
        sql: { raw: (s: string) => unknown };
      };
      const safe = clean.replace(/'/g, "''");
      const result = (await drizzle.execute(
        sql.raw(`
          SELECT id, weight_kg, logged_at
          FROM "weight_logs"
          WHERE lower(customer_email) = '${safe}'
          ORDER BY logged_at ASC
        `),
      )) as
        | { rows?: Array<Record<string, unknown>> }
        | Array<Record<string, unknown>>;
      const rows = Array.isArray(result) ? result : (result.rows ?? []);
      for (const r of rows) {
        const weightKg = num(r.weight_kg);
        if (weightKg === null) continue;
        manual.push({
          id: Number(r.id),
          date: r.logged_at
            ? new Date(r.logged_at as string).toISOString()
            : new Date().toISOString(),
          weightKg,
          heightCm: null,
          bmi: null,
          status: "logged",
          source: "log",
        });
      }
    }
  } catch {
    // table may not exist yet / DB unavailable — fall back to consultations only
  }

  const merged = [...consult.entries, ...manual].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  return summarize(clean, merged);
}
