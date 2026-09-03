"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import {
  WEGOVY_DEFAULT,
  type WegovyFaqContent,
} from "@/lib/wegovyContentTypes";

/**
 * Wegovy FAQ — Figma node 1:2097.
 * 1440×600, bg white, py=80, inner layout=HORIZONTAL gap=40 px=60.
 * Two equal 640px columns: heading left, accordion right.
 * Each listitem: 640×60, full border #142e2a sw=1, gap=16 between items, p=16.
 * Plus icon: 28×28, r=full, fill=#f7f9f2, border #142e2a sw=1.
 */

export default function WegovyFaq({
  content = WEGOVY_DEFAULT.faq,
}: {
  content?: WegovyFaqContent;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="w-full scroll-mt-28 bg-white py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-10">

          {/* LEFT — heading: Gilroy-SemiBold 48px / lh 52px / ls -1.2px */}
          <Reveal as="div">
            <h2 className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
              {content.heading}{" "}
              <em className="font-serif italic font-normal">
                {content.headingAccent}
              </em>
            </h2>
          </Reveal>

          {/* RIGHT — accordion: list gap=16, each item full border #142e2a */}
          <Reveal as="div" delay={100}>
            <ul className="flex w-full flex-col">
              {content.items.map((f, i) => {
                const isOpen = open === i;
                return (
                  <li key={i} className="border-b border-[#142e2a]/15 bg-white">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left"
                    >
                      {/* Question: Saans 16.3px w=570 lh=19.5 ls=-0.02em */}
                      <span className="font-ui text-[15px] font-semibold leading-[19.5px] tracking-[-0.02em] text-[#142e2a] md:text-[16.3px]">
                        {f.q}
                      </span>
                      {/* Plus icon: 28×28, r=full, fill=#f7f9f2, border #142e2a */}
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#142e2a] bg-[#f7f9f2] transition-transform duration-300"
                        style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                        aria-hidden
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 2v10M2 7h10" stroke="#142e2a" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>

                    {/* Answer panel */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-4 pb-4 font-ui text-[14px] leading-[22px] tracking-[-0.02em] text-[#142e2a]/70">
                          {f.a}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
