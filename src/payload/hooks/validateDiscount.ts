import type { CollectionBeforeValidateHook } from "payload";

/**
 * Normalize and validate discount rows on write.
 * - Uppercases and trims the code
 * - Ensures percentage values are within 0–100
 * - Ensures fixed values are non-negative
 */
export const normalizeDiscount: CollectionBeforeValidateHook = async ({
  data,
}) => {
  if (!data) return data;

  if (typeof data.code === "string") {
    data.code = data.code.trim().toUpperCase();
  }

  if (data.type === "percentage" && typeof data.value === "number") {
    data.value = Math.min(100, Math.max(0, data.value));
  }

  if (data.type === "fixed" && typeof data.value === "number") {
    data.value = Math.max(0, data.value);
  }

  return data;
};

/**
 * Shape we expect a discount doc to conform to at runtime. Defined
 * loosely so we can pass in untyped Payload docs (JsonObject & TypeWithID)
 * without forcing a generated-types dependency on callers.
 */
export type DiscountDoc = {
  isActive?: boolean | null;
  expiryDate?: string | Date | null;
  usageLimit?: number | null;
  usageCount?: number | null;
  type?: "percentage" | "fixed" | string | null;
  value?: number | null;
};

/**
 * Returns { valid, reason } for a given discount doc vs. the current
 * order subtotal. Shared by the endpoint + any other server-side consumer.
 */
export function evaluateDiscount(
  discount: DiscountDoc | null | undefined | Record<string, unknown>,
  subtotal: number
): { valid: boolean; reason?: string; amount: number } {
  if (!discount) return { valid: false, reason: "Discount not found", amount: 0 };

  const d = discount as DiscountDoc;

  if (!d.isActive) return { valid: false, reason: "Discount inactive", amount: 0 };

  if (d.expiryDate) {
    const expiry = new Date(d.expiryDate);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return { valid: false, reason: "Discount expired", amount: 0 };
    }
  }

  if (
    typeof d.usageLimit === "number" &&
    typeof d.usageCount === "number" &&
    d.usageCount >= d.usageLimit
  ) {
    return { valid: false, reason: "Discount usage limit reached", amount: 0 };
  }

  const value = typeof d.value === "number" ? d.value : 0;
  if (value <= 0) return { valid: false, reason: "Invalid discount value", amount: 0 };

  const amount =
    d.type === "percentage"
      ? Math.round(((subtotal * value) / 100) * 100) / 100
      : Math.min(subtotal, value);

  return { valid: true, amount };
}
