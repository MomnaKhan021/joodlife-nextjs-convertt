"use client";

import { useState } from "react";
import type { Dosage } from "@/lib/pdp-products";

interface DosagePickerProps {
  dosages: Dosage[];
  fromPrice: string;
  /** Called when "Am I Eligible?" CTA is clicked */
  onEligibilityCheck?: (dosage: Dosage) => void;
  /** Called when "Add to Cart" CTA is clicked */
  onAddToCart?: (dosage: Dosage) => void;
}

/**
 * Dosage selector — Figma 3:1664.
 *
 * Renders a grid of dosage cards (6 across on desktop, 2 across on
 * mobile). Each card shows the dose label and its pack price. The
 * selected dose gets a dark-green outline. Below the grid: the "from"
 * monthly price + two stacked CTAs ("Add to Cart" primary,
 * "Am I Eligible?" secondary).
 */
export default function DosagePicker({
  dosages,
  fromPrice,
  onEligibilityCheck,
  onAddToCart,
}: DosagePickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // The headline price reflects the currently-selected dosage (falling back
  // to the "from" price only when there are no variants).
  const selectedPrice = dosages[selectedIndex]?.perPack ?? fromPrice;

  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-display text-[18px] font-semibold leading-[22px] tracking-[-0.01em] text-[#142e2a]">
        Choose your dosage
      </h3>

      {/* Dosage cards grid */}
      <div
        role="radiogroup"
        aria-label="Dosage options"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {dosages.map((d, i) => {
          const isSelected = i === selectedIndex;
          return (
            <button
              key={d.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedIndex(i)}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-[14px] px-2 py-4",
                "transition-all duration-200 ease-out",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142e2a]",
                isSelected
                  ? "border-2 border-[#142e2a] bg-white shadow-[0_4px_14px_-6px_rgba(20,46,42,0.18)]"
                  : "border-2 border-transparent bg-[#f7f9f2] hover:border-[#142e2a]/30",
              ].join(" ")}
            >
              <span className="font-display text-[15px] font-bold leading-[18px] tracking-[-0.01em] text-[#142e2a]">
                {d.label}
              </span>
              <span className="font-ui text-[12px] leading-[16px] text-[#142e2a]/70">
                {d.perPack}
              </span>
            </button>
          );
        })}
      </div>

      {/* Price + CTA */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold tracking-[-0.01em] text-[#142e2a]">
            {selectedPrice}
          </span>
          <span className="font-ui text-[14px] text-[#142e2a]/70">/month</span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onAddToCart?.(dosages[selectedIndex])}
            className="inline-flex h-[54px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-bold uppercase tracking-[0.06em] text-white transition-colors duration-200 hover:bg-[#0c2421] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142e2a]"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() => onEligibilityCheck?.(dosages[selectedIndex])}
            className="inline-flex h-[54px] w-full items-center justify-center rounded-lg border-2 border-[#142e2a] bg-transparent px-6 font-ui text-[14px] font-bold uppercase tracking-[0.06em] text-[#142e2a] transition-colors duration-200 hover:bg-[#142e2a] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142e2a]"
          >
            Am I Eligible?
          </button>
        </div>
      </div>
    </div>
  );
}
