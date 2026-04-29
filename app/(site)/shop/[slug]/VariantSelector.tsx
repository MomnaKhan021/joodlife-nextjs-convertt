"use client";

import Link from "next/link";
import { useState } from "react";

export type Variant = {
  label?: string;
  size?: string | null;
  color?: string | null;
  price?: number | null;
  comparePrice?: number | null;
  sku?: string | null;
  stock?: number | null;
};

export default function VariantSelector({
  variants,
  fallbackPrice,
  productSlug,
}: {
  productId: string | number;
  variants: Variant[];
  fallbackPrice?: number | null;
  productSlug: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = variants[activeIndex];

  const price =
    active?.price !== undefined && active?.price !== null
      ? active.price
      : fallbackPrice;
  const compareAt = active?.comparePrice;

  const consultationHref = `/consultation?product=${encodeURIComponent(
    productSlug
  )}${active?.label ? `&dose=${encodeURIComponent(active.label)}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Dosage chip grid — 3 cols on mobile, 6 across on md+ for the full row */}
      {variants.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {variants.map((v, i) => {
            const isActive = i === activeIndex;
            const variantPrice = v.price ?? fallbackPrice;
            return (
              <button
                key={`${v.label}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 font-ui transition-all ${
                  isActive
                    ? "border-[#142e2a] bg-[#142e2a] text-white shadow-[0_4px_12px_rgba(20,46,42,0.15)]"
                    : "border-[#142e2a]/20 bg-white text-[#142e2a] hover:border-[#142e2a]"
                }`}
              >
                <span className="text-[14px] font-semibold">
                  {v.label ?? `Variant ${i + 1}`}
                </span>
                {typeof variantPrice === "number" ? (
                  <span
                    className={`text-[11px] font-medium ${
                      isActive ? "text-white/80" : "text-[#142e2a]/55"
                    }`}
                  >
                    £{variantPrice.toFixed(0)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Price line */}
      <div className="flex items-baseline gap-3">
        <span className="font-ui text-[15px] text-[#142e2a]/65">From</span>
        <span className="font-display text-[28px] font-bold tracking-[-0.01em] text-[#142e2a] md:text-[30px]">
          {typeof price === "number" ? `£${price.toFixed(2)}` : "—"}
        </span>
        <span className="font-ui text-[15px] text-[#142e2a]/65">/ month</span>
        {typeof compareAt === "number" &&
        typeof price === "number" &&
        compareAt > price ? (
          <span className="font-ui text-[16px] text-[#142e2a]/45 line-through">
            £{compareAt.toFixed(2)}
          </span>
        ) : null}
      </div>

      {/* CTA — links to the consultation flow */}
      <Link
        href={consultationHref}
        className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)]"
      >
        Check Your Eligibility
      </Link>
    </div>
  );
}
