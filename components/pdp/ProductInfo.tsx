"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DosagePicker from "./DosagePicker";
import {
  CheckCircleIcon,
  ICON_MAP,
  PlusIcon,
} from "./PdpIcons";
import { useCart } from "@/components/cart/CartContext";
import type { Dosage, PDPProduct } from "@/lib/pdp-products";

interface ProductInfoProps {
  product: PDPProduct;
}

/**
 * Stable numeric IDs for the static PDP catalog so cart-item dedup
 * (which keys on productId+dose) works the same way it does for
 * Payload-backed products. Picked deterministically per slug.
 */
const PRODUCT_ID_BY_SLUG: Record<PDPProduct["slug"], number> = {
  mounjaro: 1001,
  wegovy: 1002,
  saxenda: 1003,
};

/** "£90.00" → 90, "From £112" → 112, falls back to 0 on garbage. */
function parsePrice(formatted: string): number {
  const match = formatted.match(/(\d[\d,]*\.?\d*)/);
  if (!match) return 0;
  return Number.parseFloat(match[1].replace(/,/g, "")) || 0;
}

/**
 * Product info column — Figma 3:1664 (right side).
 *
 * Stack:
 *   1. Trustpilot pill
 *   2. Heading "{title} {italicWord}"
 *   3. Lede paragraph
 *   4. "Why start your journey with joodlife" — 4 small icons + labels
 *   5. DosagePicker (with price + Am I Eligible CTA)
 *   6. Three service chips (Next-day delivery / Safe payment / etc)
 *   7. Accordions: How it works / Is X safe? / Side effects
 */
export default function ProductInfo({ product }: ProductInfoProps) {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const router = useRouter();
  const { addItem, openDrawer } = useCart();

  const handleAddToCart = (dosage: Dosage) => {
    addItem({
      productId: PRODUCT_ID_BY_SLUG[product.slug],
      slug: product.slug,
      title: product.title,
      dose: dosage.label,
      price: parsePrice(dosage.perPack),
      imageUrl: product.gallery[0]?.src ?? null,
    });
    openDrawer();
  };

  const handleEligibility = (dosage: Dosage) => {
    const params = new URLSearchParams({
      product: product.slug,
      dose: dosage.label,
    });
    router.push(`/consultation?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-7">
      {/* Trustpilot pill */}
      <a
        href="https://www.trustpilot.com/review/joodlife.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f7f9f2] px-3 py-1.5 transition-colors hover:bg-[#e7ecd7] focus-visible:outline-2 focus-visible:outline-[#00b67a]"
        aria-label="View reviews on Trustpilot"
      >
        <span className="font-ui text-[12px] font-semibold text-[#142e2a]">
          Trustpilot
        </span>
        <span className="flex items-center gap-0.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 16 16" fill="#00b67a">
              <rect width="16" height="16" rx="2" />
              <path d="M8 3L9.4 6.2L13 6.5L10.3 8.8L11.1 12.3L8 10.6L4.9 12.3L5.7 8.8L3 6.5L6.6 6.2L8 3Z" fill="#ffffff" />
            </svg>
          ))}
        </span>
        <span className="font-ui text-[12px] font-medium text-[#142e2a]">
          {product.ratingLabel}
        </span>
      </a>

      {/* Heading */}
      <h1 className="font-display text-[34px] font-bold leading-[38px] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[44px]">
        {product.title}{" "}
        <em className="font-serif italic font-normal">{product.italicWord}</em>
      </h1>

      {/* Lede */}
      <p className="font-ui text-[14px] leading-[22px] tracking-[-0.005em] text-[#142e2a]/80 md:text-[15px] md:leading-[24px]">
        {product.lede}
      </p>

      {/* 4 features */}
      <div className="flex flex-col gap-3">
        <p className="font-ui text-[13px] font-semibold text-[#142e2a]/70">
          Why start your journey with joodlife
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
          {product.features.map((f) => {
            const Icon = ICON_MAP[f.icon as keyof typeof ICON_MAP];
            return (
              <div key={f.label} className="flex flex-col items-start gap-1.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f9f2]">
                  {Icon ? <Icon /> : null}
                </span>
                <span className="font-ui text-[11px] font-medium leading-[14px] tracking-[-0.01em] text-[#142e2a] md:text-[12px] md:leading-[15px]">
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dosage picker */}
      <DosagePicker
        dosages={product.dosages}
        fromPrice={product.fromPrice}
        onAddToCart={handleAddToCart}
        onEligibilityCheck={handleEligibility}
      />

      {/* 3 service chips */}
      <div className="flex flex-wrap gap-2">
        {product.serviceChips.map((c) => {
          const Icon = ICON_MAP[c.icon as keyof typeof ICON_MAP];
          return (
            <span
              key={c.label}
              className="inline-flex items-center gap-2 rounded-full bg-[#f7f9f2] px-3 py-2"
            >
              <span className="grid h-5 w-5 place-items-center">
                {Icon ? <Icon /> : null}
              </span>
              <span className="font-ui text-[12px] font-medium text-[#142e2a]">
                {c.label}
              </span>
            </span>
          );
        })}
      </div>

      {/* Accordions: How it works / Is X safe? / Side effects (always-open) */}
      <ul className="flex flex-col">
        {[
          { q: "How it works" },
          { q: `Is ${product.title} safe?` },
        ].map((a, i) => {
          const isOpen = openAccordion === i;
          return (
            <li key={a.q} className="border-t border-[#142e2a]/12 last:border-b">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenAccordion(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-ui text-[14px] font-medium leading-[20px] text-[#142e2a]">
                  {a.q}
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f7f9f2]">
                  <PlusIcon open={isOpen} />
                </span>
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-4 font-ui text-[13px] leading-[20px] text-[#142e2a]/75">
                    {i === 0
                      ? `Get prescribed ${product.title} after a quick online consultation. We deliver to your door and support you through every step.`
                      : product.safetyBody}
                  </p>
                </div>
              </div>
            </li>
          );
        })}

        {/* Side effects — always-open block */}
        <li className="border-t border-[#142e2a]/12 last:border-b">
          <div className="flex flex-col gap-3 py-4">
            <h4 className="font-ui text-[14px] font-semibold leading-[20px] text-[#142e2a]">
              {product.title} side effects
            </h4>
            <p className="font-ui text-[13px] leading-[20px] text-[#142e2a]/75">
              {product.safetySideEffects}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
