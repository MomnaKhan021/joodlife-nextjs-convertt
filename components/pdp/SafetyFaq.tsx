"use client";

import Image from "next/image";
import { useState } from "react";
import { PlusIcon } from "./PdpIcons";
import type { PDPProduct } from "@/lib/pdp-products";
import { PDP_FAQS } from "@/lib/pdp-products";

interface SafetyFaqProps {
  product: PDPProduct;
}

/**
 * "Is X safe?" section — Figma 3:2292.
 *
 * Left: doctor portrait in a rounded card.
 * Right: heading + body + side-effects copy + collapsible FAQ list
 *        + green outlined "CHECK ELIGIBLE" button.
 */
export default function SafetyFaq({ product }: SafetyFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10 lg:gap-16">
      {/* Doctor portrait */}
      <div className="relative h-[360px] w-full overflow-hidden rounded-[20px] bg-[#f7f9f2] md:h-[560px]">
        <Image
          src="/assets/figma/pdp/safety-doctor.png"
          alt="A clinician in scrubs reviewing notes on a tablet"
          fill
          sizes="(max-width: 768px) 92vw, 500px"
          quality={95}
          className="object-cover object-center"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-[#142e2a] md:text-[40px] md:leading-[48px]">
          {product.safetyTitle.split(" safe?")[0]}{" "}
          <em className="font-serif italic font-normal">safe?</em>
        </h2>

        <p className="font-ui text-[15px] leading-[24px] tracking-[-0.01em] text-[#142e2a]/85 md:text-[16px] md:leading-[26px]">
          {product.safetyBody}
        </p>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-[15px] font-bold leading-[20px] text-[#142e2a] md:text-[16px]">
            What are the common side effects?
          </h3>
          <p className="font-ui text-[14px] leading-[22px] text-[#142e2a]/85 md:text-[15px] md:leading-[24px]">
            {product.safetySideEffects}
          </p>
        </div>

        {/* FAQ list */}
        <ul className="flex flex-col">
          {PDP_FAQS.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <li
                key={i}
                className="border-t border-[#142e2a]/12 last:border-b"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left md:py-5"
                >
                  <span className="font-ui text-[14px] font-medium leading-[20px] text-[#142e2a] md:text-[15px] md:leading-[22px]">
                    {f.q.replace("Mounjaro", product.title)}
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
                    <p className="pb-4 font-ui text-[13px] leading-[20px] text-[#142e2a]/75 md:pb-5 md:text-[14px] md:leading-[22px]">
                      {f.a?.replace("Mounjaro", product.title)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <a
          href="#check-eligible"
          className="mt-2 inline-flex h-[50px] w-full max-w-[200px] items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors duration-200 hover:bg-[#0c2421]"
        >
          Check Eligible
        </a>
      </div>
    </div>
  );
}
