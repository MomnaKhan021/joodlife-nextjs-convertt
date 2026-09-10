import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import { evaluateDiscount } from "@/src/payload/hooks/validateDiscount";

/**
 * Server-side discount-code resolution. Looks the code up in the
 * dashboard-managed `discounts` collection (via the local API, bypassing
 * the logged-in read rule so anonymous checkouts can use codes) and runs
 * the shared `evaluateDiscount` rules (active / not expired / under usage
 * limit) to compute the £ amount off for a given subtotal.
 *
 * Usage limits are counted from real orders, not a checkout-time counter:
 *   - a redemption is an order that was actually PAID with the code
 *     (usage_count is bumped when payment succeeds, see orderConfirmationOnce);
 *   - an unpaid order placed in the last 30 minutes by someone else "holds"
 *     the code, so two shoppers can't both take the last use at once —
 *     but a customer retrying their own declined card is never blocked;
 *   - "once per customer" checks paid orders by the same email.
 *
 * This is the single source of truth used by BOTH the /api/discount probe
 * (for the checkout UI) and /api/checkout (which actually applies it), so
 * what the customer sees always equals what they're charged.
 */
export type AppliedDiscount = {
  valid: boolean;
  amount: number;
  reason?: string;
  code?: string;
  type?: "percentage" | "fixed";
  value?: number;
};

type DiscountRow = {
  code?: string;
  type?: "percentage" | "fixed";
  value?: number;
  isActive?: boolean | null;
  expiryDate?: string | null;
  usageLimit?: number | null;
  usageCount?: number | null;
  oncePerCustomer?: boolean | null;
};

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{0,39}$/;

const FRIENDLY: Record<string, string> = {
  "Discount not found": "This code isn’t valid.",
  "Discount inactive": "This code is no longer active.",
  "Discount expired": "This code has expired.",
  "Discount usage limit reached": "This code has reached its usage limit.",
  "Invalid discount value": "This code isn’t valid.",
};

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";

function drizzleOf(payload: Awaited<ReturnType<typeof getPayloadInstance>>): DrizzleLike | null {
  const d = (payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } })
    .drizzle;
  return d?.execute ? (d as DrizzleLike) : null;
}

// The two newer columns are added on boot by ensureSchema, but a code check
// must never depend on that having run yet — make sure once per process.
let columnsReady: Promise<void> | null = null;
function ensureColumns(drizzle: DrizzleLike, raw: (s: string) => unknown): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      await drizzle.execute(
        raw(`ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS once_per_customer boolean DEFAULT false`),
      );
      await drizzle.execute(raw(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS discount_code varchar`));
    })().catch(() => {
      columnsReady = null; // retry on the next check
    });
  }
  return columnsReady;
}

/**
 * Look the code up with plain SQL. Payload's local API selects every column
 * the collection declares, so a column missing from the live table (e.g. a
 * deploy whose schema repair hasn't run) would make every code check fail;
 * reading the optional flag through to_jsonb keeps this working regardless.
 */
async function findDiscount(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  code: string,
): Promise<DiscountRow | null> {
  const drizzle = drizzleOf(payload);
  if (!drizzle) return null;
  const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };
  await ensureColumns(drizzle, sql.raw);
  const res = await drizzle.execute(
    sql.raw(`
      SELECT code, type::text AS type, value, expiry_date, usage_limit, usage_count, is_active,
             (to_jsonb(d) ->> 'once_per_customer') AS once_per_customer
        FROM "discounts" d
       WHERE upper(code) = ${esc(code)}
       LIMIT 1
    `),
  );
  const r = rowsOf<Record<string, unknown>>(res)[0];
  if (!r) return null;
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    code: String(r.code ?? code),
    type: r.type === "fixed" ? "fixed" : "percentage",
    value: num(r.value) ?? 0,
    isActive: r.is_active === true || r.is_active === "true",
    expiryDate: r.expiry_date ? String(r.expiry_date) : null,
    usageLimit: num(r.usage_limit),
    usageCount: num(r.usage_count) ?? 0,
    oncePerCustomer: r.once_per_customer === "true" || r.once_per_customer === true,
  };
}

/** Paid redemptions, active holds by other shoppers, and this customer's own paid uses. */
async function countRedemptions(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  code: string,
  email: string | null,
): Promise<{ paid: number; reserved: number; mine: number }> {
  try {
    const drizzle = drizzleOf(payload);
    if (!drizzle) return { paid: 0, reserved: 0, mine: 0 };
    const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };

    const paidExpr =
      "(LOWER(COALESCE(payment_status::text, '')) = 'paid' OR LOWER(COALESCE(status::text, '')) IN ('paid','shipped','delivered'))";
    const emailSql = email ? esc(email.trim().toLowerCase()) : null;
    const res = await drizzle.execute(
      sql.raw(`
        SELECT
          COUNT(*) FILTER (WHERE ${paidExpr}) AS paid,
          COUNT(*) FILTER (
            WHERE NOT ${paidExpr}
              AND LOWER(COALESCE(status::text, '')) NOT IN ('cancelled','refunded')
              AND created_at > now() - interval '30 minutes'
              ${emailSql ? `AND LOWER(COALESCE(customer_email, '')) <> ${emailSql}` : ""}
          ) AS reserved,
          ${emailSql ? `COUNT(*) FILTER (WHERE ${paidExpr} AND LOWER(COALESCE(customer_email, '')) = ${emailSql})` : "0"} AS mine
          FROM "orders"
         WHERE upper(COALESCE(discount_code, '')) = ${esc(code)}
      `),
    );
    const r = rowsOf<{ paid: unknown; reserved: unknown; mine: unknown }>(res)[0];
    return {
      paid: Number(r?.paid ?? 0) || 0,
      reserved: Number(r?.reserved ?? 0) || 0,
      mine: Number(r?.mine ?? 0) || 0,
    };
  } catch {
    // Column not there yet / DB hiccup: fall back to the stored counter only.
    return { paid: 0, reserved: 0, mine: 0 };
  }
}

export async function applyDiscountCode(
  rawCode: string,
  subtotal: number,
  opts: { email?: string | null } = {},
): Promise<AppliedDiscount> {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { valid: false, amount: 0, reason: "Enter a discount code." };
  if (!CODE_RE.test(code)) {
    return { valid: false, amount: 0, reason: "This code isn’t valid." };
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { valid: false, amount: 0, reason: "Add items to your cart first." };
  }

  try {
    const payload = await getPayloadInstance();
    const doc = await findDiscount(payload, code);
    if (!doc) {
      return { valid: false, amount: 0, reason: FRIENDLY["Discount not found"] };
    }

    const email = (opts.email ?? "").trim() || null;
    const limit = typeof doc.usageLimit === "number" && doc.usageLimit > 0 ? doc.usageLimit : null;
    const perCustomer = doc.oncePerCustomer === true;
    const usage =
      limit !== null || perCustomer
        ? await countRedemptions(payload, code, email)
        : { paid: 0, reserved: 0, mine: 0 };

    if (perCustomer && usage.mine > 0) {
      return {
        valid: false,
        amount: 0,
        reason: "You’ve already used this code — it can only be used once per customer.",
      };
    }

    // Effective redemptions = the higher of the stored counter and paid orders,
    // plus codes currently held by other shoppers mid-checkout.
    const used = Math.max(Number(doc.usageCount ?? 0) || 0, usage.paid) + usage.reserved;
    const evaluated = evaluateDiscount({ ...doc, usageCount: used }, subtotal);
    if (!evaluated.valid) {
      const reason =
        evaluated.reason === "Discount usage limit reached" && limit === 1
          ? "This code has already been used — it was valid for one order only."
          : FRIENDLY[evaluated.reason ?? ""] ?? "This code isn’t valid.";
      return { valid: false, amount: 0, reason };
    }

    return {
      valid: true,
      amount: evaluated.amount,
      code: doc.code ?? code,
      type: doc.type,
      value: doc.value,
    };
  } catch {
    return {
      valid: false,
      amount: 0,
      reason: "Couldn’t check that code right now. Please try again.",
    };
  }
}
