/**
 * Individual orders removed from the admin views by hand.
 *
 * These are test rows or duplicates that shouldn't appear in Orders, To
 * Dispatch, Dispatched or the counts. Nothing is deleted — like the
 * legacy-data cutoff in lib/adminHide.ts this is a reversible display
 * filter, so the records remain in the database for the pharmacy's audit
 * trail. Delete an entry here and it reappears.
 *
 * Keep the list short: for anything routine, use the Remove button on the
 * To Dispatch card instead.
 */
export const HIDDEN_ORDER_NUMBERS: readonly string[] = [
  "JL3048", // test order (Momna Khan) — removed before launch
];

/** Case-insensitive check used by the admin list/queue code. */
export function isHiddenOrderNumber(raw: unknown): boolean {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return false;
  return HIDDEN_ORDER_NUMBERS.some((n) => n.toUpperCase() === s);
}

/**
 * SQL fragment excluding the hidden orders, e.g.
 *   hiddenOrdersSql("order_number") -> "UPPER(COALESCE(order_number,'')) NOT IN ('JL3048')"
 * Returns "" when the list is empty so callers can concatenate safely.
 */
export function hiddenOrdersSql(column = "order_number"): string {
  if (HIDDEN_ORDER_NUMBERS.length === 0) return "";
  const list = HIDDEN_ORDER_NUMBERS.map(
    (n) => `'${n.replace(/'/g, "''").toUpperCase()}'`,
  ).join(", ");
  return `UPPER(COALESCE(${column}, '')) NOT IN (${list})`;
}
