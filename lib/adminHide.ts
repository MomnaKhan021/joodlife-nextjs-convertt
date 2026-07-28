/**
 * Legacy-data hide.
 *
 * Everything created before this cutoff is hidden from the admin dashboard —
 * the sidebar counts and the data-browser lists for orders, consultations and
 * customers, plus the Clinical Check and Abandoned Checkout queues (which are
 * consultation-driven). The rows are NOT deleted: they stay in the database
 * untouched. This is purely a display filter, so it is fully reversible —
 * set `HIDE_BEFORE` to `null` to reveal everything again.
 *
 * Put in place when the operator asked for a clean slate ahead of re-syncing
 * data from HubSpot. Any NEW record created after the cutoff shows normally.
 */
export const HIDE_BEFORE: string | null = "2026-07-28T10:46:00Z";

/**
 * Raw SQL condition that keeps only rows created at/after the cutoff.
 * Returns `""` when hiding is disabled (HIDE_BEFORE === null).
 */
export function hideBeforeSql(col = "created_at"): string {
  return HIDE_BEFORE ? `${col} >= '${HIDE_BEFORE}'` : "";
}

/** Collections that participate in the legacy-data hide. */
export const HIDE_TYPES = new Set(["orders", "consultations", "users"]);
