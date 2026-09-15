/**
 * Shared SQL for deciding whether an order is a REPEAT supply (a "Reorder")
 * rather than a first "New Supply". One definition, used by the Orders list,
 * the order detail page and the To Dispatch queue so every screen agrees.
 */

/**
 * SQL boolean predicate: does the row at `<alias>` count as a REAL order when
 * judging whether a customer has ordered before? Includes paid checkouts,
 * staff-raised approval orders (£0 by design), and synced historical purchases
 * from Shopify / HubSpot (they carry a hubspot_deal_id, and their order_number
 * is the deal-name format "JL2043: Name — Product"). Excludes cancelled /
 * refunded orders and abandoned, never-paid checkout attempts.
 */
export function realOrderPredicate(alias: string): string {
  const a = alias;
  return `(
    LOWER(COALESCE(${a}.status::text,'')) NOT IN ('cancelled','refunded')
    AND (
      LOWER(COALESCE(${a}.payment_status::text,'')) = 'paid'
      OR COALESCE(CAST(${a}.notes AS TEXT),'') ILIKE 'Auto-created on clinical approval%'
      OR (${a}.hubspot_deal_id IS NOT NULL AND ${a}.hubspot_deal_id <> '')
      OR COALESCE(CAST(${a}.order_number AS TEXT),'') LIKE '%: %'
    )
  )`;
}

/**
 * SQL boolean: is the current "orders" row a repeat supply for its customer?
 *   1. The order number itself says "reorder" (HubSpot deal names do), or
 *   2. the same customer has an EARLIER real order (native or synced Shopify).
 * A synced prior order that was never marked "paid" still counts — that was the
 * bug that made returning Shopify customers read "New Supply".
 */
export const IS_REORDER_SQL = `(
  COALESCE(CAST(order_number AS TEXT),'') ILIKE '%reorder%'
  OR (
    "orders".customer_email IS NOT NULL AND TRIM("orders".customer_email) <> ''
    AND EXISTS (
      SELECT 1 FROM "orders" o2
      WHERE LOWER(o2.customer_email) = LOWER("orders".customer_email)
        AND o2.id <> "orders".id
        AND ${realOrderPredicate("o2")}
        AND (
          o2.created_at < "orders".created_at
          OR (o2.created_at = "orders".created_at AND o2.id < "orders".id)
        )
    )
  )
)`;
