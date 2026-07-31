/**
 * Sequential order numbers for the new site: JL3000, JL3001, JL3002, …
 *
 * Backed by the `orders_jl_seq` Postgres sequence (created in ensureSchema,
 * starting at 3000). One atomic nextval() per order, so the number is unique
 * and gap-tolerant under concurrency. The SAME number is stored on the order
 * and used in every email, so the admin and the customer always see one id.
 */
type Exec = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

export async function nextOrderNumber(drizzle: Exec, sql: SqlRaw): Promise<string> {
  try {
    const r = await drizzle.execute(sql.raw(`SELECT nextval('orders_jl_seq')::bigint AS n`));
    const rows = Array.isArray(r)
      ? (r as Array<{ n?: number | string }>)
      : ((r as { rows?: Array<{ n?: number | string }> })?.rows ?? []);
    const n = rows[0]?.n;
    if (n != null && String(n).length > 0) return `JL${n}`;
  } catch {
    /* fall through to the timestamp fallback — never block an order */
  }
  return `JL${Date.now()}`;
}
