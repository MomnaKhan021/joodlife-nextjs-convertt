import type { Endpoint, PayloadRequest } from "payload";

import { evaluateDiscount } from "../hooks/validateDiscount";

/**
 * POST /api/discounts/apply
 * Body: { code: string, subtotal: number }
 * Response: { valid: boolean, reason?: string, amount: number, code: string, total: number }
 *
 * Public-facing endpoint used by the storefront cart to validate a
 * coupon code and compute the discount amount without exposing any
 * other discount rows.
 */
export const applyDiscountEndpoint: Endpoint = {
  path: "/discounts/apply",
  method: "post",
  handler: async (req: PayloadRequest) => {
    const body = (req.data ?? {}) as { code?: string; subtotal?: number };
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);

    if (!code) {
      return Response.json(
        { valid: false, reason: "Missing discount code", amount: 0 },
        { status: 400 }
      );
    }
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return Response.json(
        { valid: false, reason: "Invalid subtotal", amount: 0 },
        { status: 400 }
      );
    }

    const found = await req.payload.find({
      collection: "discounts",
      where: { code: { equals: code } },
      limit: 1,
      overrideAccess: true,
    });

    const discount = found.docs[0];
    const result = evaluateDiscount(discount, subtotal);

    return Response.json({
      ...result,
      code,
      subtotal,
      total: Math.max(0, Math.round((subtotal - result.amount) * 100) / 100),
    });
  },
};
