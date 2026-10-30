import "server-only";

import { cache } from "react";

import { applyDiscountCode } from "@/lib/discounts";
import { getStorefrontProduct } from "@/lib/products";

export type LanderOffer = {
  /** Lowest dose price of the product, before the first-order discount. */
  was: number;
  /** What a first order at that dose costs with the code applied. */
  now: number;
  saving: number;
  code: string;
  /** The checkout applies the code by itself (no typing needed). */
  autoApply: boolean;
};

/**
 * The ads lander's "Starting from £was £now" line. Read live from the shop —
 * the product's cheapest dose and the same discount check the checkout uses —
 * so the crossed-out and offer prices always match what a first order costs.
 * If the product or the code isn't available, there's no line (never a stale
 * or made-up price).
 */
export const getLanderOffer = cache(
  async (code: string, productSlug = "mounjaro"): Promise<LanderOffer | null> => {
    const product = await getStorefrontProduct(productSlug);
    const prices = (product?.variants ?? []).map((v) => v.price).filter((p) => p > 0);
    const was = prices.length ? Math.min(...prices) : (product?.fromPrice ?? 0);
    if (was > 0 && code.trim()) {
      const d = await applyDiscountCode(code, was);
      if (d.valid && d.amount > 0 && d.amount < was) {
        return {
          was,
          now: Math.round((was - d.amount) * 100) / 100,
          saving: d.amount,
          code: d.code ?? code.trim().toUpperCase(),
          autoApply: d.autoApply === true,
        };
      }
    }
    // Local development has no shop database: show the live figures (2.5 mg
    // at £160, FIRST20 = £20 off) so the design can be previewed.
    if (process.env.NODE_ENV === "development") {
      return { was: 160, now: 140, saving: 20, code: code.trim().toUpperCase() || "FIRST20", autoApply: true };
    }
    return null;
  },
);
