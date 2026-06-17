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

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{0,39}$/;

const FRIENDLY: Record<string, string> = {
  "Discount not found": "This code isn’t valid.",
  "Discount inactive": "This code is no longer active.",
  "Discount expired": "This code has expired.",
  "Discount usage limit reached": "This code has reached its usage limit.",
  "Invalid discount value": "This code isn’t valid.",
};

export async function applyDiscountCode(
  rawCode: string,
  subtotal: number,
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
    const res = await payload.find({
      collection: "discounts",
      where: { code: { equals: code } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const doc = res.docs?.[0] as
      | {
          code?: string;
          type?: "percentage" | "fixed";
          value?: number;
        }
      | undefined;

    const evaluated = evaluateDiscount(doc ?? null, subtotal);
    if (!evaluated.valid) {
      return {
        valid: false,
        amount: 0,
        reason: FRIENDLY[evaluated.reason ?? ""] ?? "This code isn’t valid.",
      };
    }

    return {
      valid: true,
      amount: evaluated.amount,
      code: doc?.code ?? code,
      type: doc?.type,
      value: doc?.value,
    };
  } catch {
    return {
      valid: false,
      amount: 0,
      reason: "Couldn’t check that code right now. Please try again.",
    };
  }
}
