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
  fallbackComparePrice,
}: {
  productId: string | number;
  variants: Variant[];
  fallbackPrice?: number | null;
  fallbackComparePrice?: number | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = variants[activeIndex];

  const price = active?.price ?? fallbackPrice;
  const compareAt = active?.comparePrice ?? fallbackComparePrice;
  const stock = active?.stock ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[28px] font-bold text-[#142e2a]">
          {typeof price === "number" ? `£${price.toFixed(2)}` : "—"}
        </span>
        {typeof compareAt === "number" && typeof price === "number" && compareAt > price ? (
          <span className="font-ui text-[16px] text-[#142e2a]/50 line-through">
            £{compareAt.toFixed(2)}
          </span>
        ) : null}
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-[#142e2a]/70">
            Dose / size
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

      <p className="font-ui text-[13px] text-[#142e2a]/60">
        {stock > 0 ? `In stock: ${stock}` : "Out of stock"}
      </p>

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
          disabled={stock <= 0}
          className="inline-flex h-[50px] w-fit items-center justify-center rounded-lg bg-[#142e2a] px-10 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] disabled:cursor-not-allowed disabled:bg-[#142e2a]/40"
        >
          {stock > 0 ? "Buy now" : "Sold out"}
        </button>
      </form>
    </div>
  );
}
