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
 *
 * 2026-08-27: cutoff bumped to now for a fresh start of the order → clinical
 * check → dispatch flow. All existing rows stay in the DB (customers included,
 * so a returning customer keeps their details) — they're just hidden from the
 * admin queues, which now read zero. New orders from this point show normally.
 */
export const HIDE_BEFORE: string | null = "2026-08-28 11:00:00+00";

/**
 * Raw SQL condition that keeps only rows created at/after the cutoff.
 * Returns `""` when hiding is disabled (HIDE_BEFORE === null).
 */
export function hideBeforeSql(col = "created_at"): string {
  return HIDE_BEFORE ? `${col} >= '${HIDE_BEFORE}'` : "";
}

/** Collections that participate in the legacy-data hide. Customers (`users`)
 *  are deliberately NOT hidden: the reset zeroes the order-flow queues
 *  (orders + consultations), but every customer stays visible and their
 *  details are preserved, so a returning customer keeps their data. */
export const HIDE_TYPES = new Set(["orders", "consultations"]);
