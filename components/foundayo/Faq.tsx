"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { FOUNDAYO } from "@/lib/foundayoContent";
import { ACCENT, H2, WRAP } from "./type";

/**
 * "Frequently asked questions" — Figma 2003:1823 (heading left, 640px list
 * from x=740) and the mobile frame (centred two-line heading, list below).
 * Question 16.3/19.5 medium, answer 15.3/22.9, "+" in a 26px #fff8f6 circle,
 * 16px padding, hairline divider, 16px between items. Answers start closed;
 * tap a question to open it (the + turns into a ×).
 */
export default function Faq() {
  const c = FOUNDAYO.faq;
  const [firstWord, ...rest] = c.heading.split(" ");
  const restWords = rest.join(" ");
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section id="faq" aria-label="Frequently asked questions" className="w-full scroll-mt-28 bg-white py-[60px] md:py-20">
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-[30px] lg:grid-cols-[minmax(0,1fr)_640px] lg:gap-10">
          <Reveal as="div">
            <h2 className={`${H2} text-center text-[#142e2a] lg:text-left`}>
              {/* Mobile frame breaks after the first word: "Frequently / asked questions". */}
              <span className="block lg:inline">{firstWord}</span> {restWords} <em className={ACCENT}>{c.headingAccent}</em>
            </h2>
          </Reveal>

          <ul className="flex w-full flex-col gap-4">
            {c.items.map((f, i) => {
              const open = openItems.has(i);
              return (
                <li key={f.q} className="border-b border-[#142e2a]/20 pb-4 lg:px-4 lg:pt-4">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-start justify-between gap-4 text-left"
                  >
                    <span className="font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.3px] text-[#142e2a]">{f.q}</span>
                    <span aria-hidden className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#fff8f6]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
                        <path d="M7 1v12M1 7h12" stroke="#142e2a" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="pt-3 font-ui text-[15.3px] leading-[22.9px] text-[#142e2a]/70 lg:pr-10">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
