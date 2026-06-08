import "server-only";

import { getPayloadInstance } from "@/lib/payload";

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
  /** "draft" | "submitted". */
  status: string | null;
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
};

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
  const empty: WeightLogSummary = {
    email,
    entries: [],
    startWeightKg: null,
    latestWeightKg: null,
    changeKg: null,
    latestBmi: null,
  };
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
    });
  }

  const weights = entries.map((e) => e.weightKg!).filter((n) => n !== null);
  const startWeightKg = weights.length ? weights[0] : null;
  const latestWeightKg = weights.length ? weights[weights.length - 1] : null;
  const changeKg =
    startWeightKg !== null && latestWeightKg !== null
      ? Math.round((latestWeightKg - startWeightKg) * 10) / 10
      : null;
  const latestBmi = entries.length ? entries[entries.length - 1].bmi : null;

  return { email: clean, entries, startWeightKg, latestWeightKg, changeKg, latestBmi };
}
