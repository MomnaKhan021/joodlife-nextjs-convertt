"use client";

import { useState } from "react";

export type Variant = {
  label?: string;
  price?: number | null;
  comparePrice?: number | null;
  sku?: string;
  stock?: number | null;
};

export default function VariantSelector({
  productId,
  variants,
  fallbackPrice,
}: {
  productId: string | number;
  variants: Variant[];
  fallbackPrice?: number | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = variants[activeIndex];

  const price =
    active?.price !== undefined && active?.price !== null
      ? active.price
      : fallbackPrice;
  const compareAt = active?.comparePrice;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[36px] font-semibold text-[#142e2a]">
          {typeof price === "number" ? `£${price.toFixed(2)}` : "—"}
        </span>
        <span className="font-ui text-[14px] text-[#142e2a]/60">/ month*</span>
        {typeof compareAt === "number" &&
        typeof price === "number" &&
        compareAt > price ? (
          <span className="font-ui text-[16px] text-[#142e2a]/45 line-through">
            £{compareAt.toFixed(2)}
          </span>
        ) : null}
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/60">
            Dosage
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={`${v.label}-${i}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`cursor-pointer rounded-lg border px-4 py-2 font-ui text-[14px] font-medium transition-colors ${
                    isActive
                      ? "border-[#142e2a] bg-[#142e2a] text-white"
                      : "border-[#142e2a]/20 bg-white text-[#142e2a] hover:border-[#142e2a]"
                  }`}
                >
                  {v.label ?? `Variant ${i + 1}`}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <form
        action="/api/storefront/orders"
        method="post"
        className="mt-2 flex flex-col gap-3"
      >
        <input type="hidden" name="productId" value={String(productId)} />
        {active?.sku ? (
          <input type="hidden" name="variantSku" value={active.sku} />
        ) : null}
        <button
          type="submit"
          className="inline-flex h-[54px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-10 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
        >
          Get started
        </button>
      </form>
    </div>
  );
}
