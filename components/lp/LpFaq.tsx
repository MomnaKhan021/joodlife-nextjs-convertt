"use client";

import Image from "next/image";
import { useState } from "react";

import type { LanderFaqs } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import { LP_ASSETS, LP_GUTTER, LpHeading } from "./shared";

/**
 * "Frequently asked questions" (Figma 20:752; mobile 20:1320). Questions and
 * answers use the same type as the main site's FAQ (sections/home/FaqClient).
 */
export default function LpFaq({ content: c, style }: { content: LanderFaqs; style?: SectionStyle }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-[40px] lg:py-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col gap-[24px] lg:flex-row lg:items-start lg:gap-[40px] ${LP_GUTTER}`}>
        <LpHeading lead={c.heading} accent={c.headingAccent} className="text-center lg:flex-1 lg:text-left" />

        <ul className="flex flex-col gap-[16px] lg:flex-1">
          {c.items.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={`${f.q}-${i}`} className="border-b border-[rgba(20,46,42,0.2)]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-start justify-between gap-4 p-[16px] text-left"
                >
                  <span className="font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[22px]">{f.q}</span>
                  <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[#f7f9f2]">
                    <Image
                      src={`${LP_ASSETS}/faq-plus.svg`}
                      alt=""
                      width={18}
                      height={16}
                      unoptimized
                      className={`transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="whitespace-pre-line px-[16px] pb-[16px] font-ui text-[14px] leading-[22px] text-[#142e2a]/75 md:text-[15.5px] md:leading-[24px]">{f.a}</p>
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
