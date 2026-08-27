import "server-only";

/**
 * GPHC compliance: reorder submissions don't re-collect the patient's clinical
 * baseline (date of birth, height, and often weight), so a reorder's clinical
 * summary would show "—" for age / DOB / height / weight / BMI. This carries
 * those — and only those — from the patient's most recent NEW-supply
 * consultation (matched by email), filling ONLY when the reorder is missing
 * them so a reorder's own current weight always wins. Records enriched this way
 * get an `_identity_from_prior` flag so the UI can show the reviewer the source.
 *
 * Shared by the clinical-review (Clinical Check) and dispatch (To Dispatch)
 * routes so both screens show the same baseline.
 */

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

type BackfillItem = {
  email: unknown;
  isReorder: boolean;
  answers: Record<string, unknown>;
};

const BASELINE_KEYS = [
  "date_of_birth_consultation",
  "height_cm",
  "current_weight_kg",
  "_age",
] as const;

const isEmpty = (v: unknown) =>
  v === undefined || v === null || String(v).trim() === "";

function asRows(x: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(x)) return x as Array<Record<string, unknown>>;
  const r = (x as { rows?: Array<Record<string, unknown>> })?.rows;
  return Array.isArray(r) ? r : [];
}

/**
 * Mutates each item's `answers` in place, filling the baseline fields from the
 * patient's most recent new-supply consultation. Best-effort: callers should
 * wrap in try/catch so a lookup failure never blocks the queue.
 */
export async function backfillReorderBaseline(
  items: BackfillItem[],
  db: DrizzleLike,
  sql: SqlRaw,
): Promise<void> {
  const emails = Array.from(
    new Set(
      items
        .filter(
          (c) =>
            c.isReorder &&
            (isEmpty(c.answers.date_of_birth_consultation) ||
              isEmpty(c.answers.height_cm) ||
              isEmpty(c.answers.current_weight_kg)),
        )
        .map((c) => String(c.email ?? "").trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  if (emails.length === 0) return;

  const inList = emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(",");
  const priorRes = await db.execute(
    sql.raw(
      `SELECT DISTINCT ON (LOWER(email)) LOWER(email) AS email, answers
       FROM "consultations"
       WHERE LOWER(email) IN (${inList})
         AND COALESCE(product_slug, '') <> 'reorder'
         AND TRIM(COALESCE(answers ->> 'date_of_birth_consultation', '')) <> ''
       ORDER BY LOWER(email), created_at DESC NULLS LAST, id DESC`,
    ),
  );

  const priorByEmail: Record<string, Record<string, unknown>> = {};
  for (const r of asRows(priorRes)) {
    const e = String(r.email ?? "");
    if (!e) continue;
    let prior: Record<string, unknown> = {};
    try {
      prior =
        typeof r.answers === "object" && r.answers !== null
          ? (r.answers as Record<string, unknown>)
          : JSON.parse(String(r.answers ?? "{}"));
    } catch {
      prior = {};
    }
    priorByEmail[e] = prior;
  }

  for (const c of items) {
    if (!c.isReorder) continue;
    const prior = priorByEmail[String(c.email ?? "").toLowerCase()];
    if (!prior) continue;
    let filled = false;
    for (const key of BASELINE_KEYS) {
      if (isEmpty(c.answers[key]) && !isEmpty(prior[key])) {
        c.answers[key] = prior[key];
        filled = true;
      }
    }
    if (filled) c.answers._identity_from_prior = true;
  }
}
