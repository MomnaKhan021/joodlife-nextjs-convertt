"use client";

import { useState } from "react";

import {
  CATEGORY_PAGE_DEFAULT,
  type Faq,
} from "@/lib/categoryPageContentTypes";

/**
 * Themed FAQ accordion for the category sub-pages. Accent colour is
 * passed in so each category (green / blue / pink) keeps a consistent
 * hue on the open-state highlight.
 */
export default function CategoryFaq({
  items,
  accent = "#142e2a",
  heading = CATEGORY_PAGE_DEFAULT.faqs.heading,
  headingAccent = CATEGORY_PAGE_DEFAULT.faqs.headingAccent,
}: {
  items: Faq[];
  accent?: string;
  heading?: string;
  headingAccent?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="w-full scroll-mt-28 bg-white py-[30px] md:py-10"
    >
      <div className="mx-auto flex w-full max-w-[820px] flex-col items-center gap-8 px-6 md:gap-10 md:px-10">
        <h2 className="text-center font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[44px]">
          {heading}{" "}
          <em className="font-serif font-normal italic">{headingAccent}</em>
        </h2>

        <ul className="w-full divide-y divide-[#142e2a]/10 border-y border-[#142e2a]/10">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span
                    className="font-ui text-[16px] font-semibold leading-snug transition-colors md:text-[18px]"
                    style={{ color: isOpen ? accent : "#142e2a" }}
                  >
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-transform duration-300"
                    style={{
                      borderColor: isOpen ? accent : "rgba(20,46,42,0.25)",
                      color: isOpen ? accent : "#142e2a",
                      transform: isOpen ? "rotate(45deg)" : "none",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-10 font-ui text-[15px] leading-relaxed text-[#142e2a]/75 md:text-[16px]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
