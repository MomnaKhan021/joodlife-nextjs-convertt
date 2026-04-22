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
 * Returns { valid, reason } for a given discount doc vs. the current
 * order subtotal. Shared by the endpoint + any other server-side consumer.
 */
export function evaluateDiscount(
  discount: {
    isActive?: boolean;
    expiryDate?: string | Date | null;
    usageLimit?: number | null;
    usageCount?: number | null;
    type: "percentage" | "fixed";
    value: number;
  } | null | undefined,
  subtotal: number
): { valid: boolean; reason?: string; amount: number } {
  if (!discount) return { valid: false, reason: "Discount not found", amount: 0 };
  if (!discount.isActive) return { valid: false, reason: "Discount inactive", amount: 0 };

  if (discount.expiryDate) {
    const expiry = new Date(discount.expiryDate);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return { valid: false, reason: "Discount expired", amount: 0 };
    }
  }

  if (
    typeof discount.usageLimit === "number" &&
    typeof discount.usageCount === "number" &&
    discount.usageCount >= discount.usageLimit
  ) {
    return { valid: false, reason: "Discount usage limit reached", amount: 0 };
  }

  const amount =
    discount.type === "percentage"
      ? Math.round(((subtotal * discount.value) / 100) * 100) / 100
      : Math.min(subtotal, discount.value);

  return { valid: true, amount };
}
