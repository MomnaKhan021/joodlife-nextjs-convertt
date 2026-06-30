"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";

/**
 * Wegovy FAQ — Figma node 1:2097.
 * Heading on the left, accordion on the right (Wegovy-specific questions).
 */

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the Wegovy® Pill?",
    a: "The Wegovy® Pill is a once-daily oral form of semaglutide — the same GLP-1 active ingredient as the Wegovy injection — used to support clinically guided weight loss.",
  },
  {
    q: "How effective is the oral form vs. the injection?",
    a: "In manufacturer studies, adults taking the Wegovy® Pill lost an average of ~14% of body weight at 64 weeks. Both the pill and the pen support meaningful weight loss; your prescriber will help you choose the right option.",
  },
  {
    q: "Do I need to take it on an empty stomach?",
    a: "Yes. Oral semaglutide is taken on an empty stomach with a small sip of water, at least 30 minutes before your first food, drink or other medicines of the day.",
  },
  {
    q: "What are the side effects?",
    a: "The most common side effects are gastrointestinal — nausea, diarrhoea, vomiting and constipation — and usually ease as your body adjusts. Our clinical team supports you throughout.",
  },
  {
    q: "Can I switch between pill and injectable?",
    a: "In many cases, yes. Switching is a clinical decision made with your prescriber based on your response, tolerance and preference.",
  },
  {
    q: "Does insurance cover the Wegovy® Pill?",
    a: "Jood is a private weight-loss service, so treatment is paid for directly. Transparent monthly pricing is shown in the dosing section above.",
  },
];

export default function WegovyFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="w-full scroll-mt-28 bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:px-[60px]">
        <Reveal as="div">
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#142e2a] md:text-[52px] md:leading-[1.02]">
            Frequently asked{" "}
            <span className="font-serif italic font-normal">questions</span>
          </h2>
        </Reveal>

        <Reveal as="div" delay={100} className="w-full">
          <ul className="flex w-full flex-col">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={i} className="border-b border-[#142e2a]/12">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-ui text-[15px] font-medium leading-[22px] text-[#142e2a] md:text-[16px]">
                      {f.q}
                    </span>
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f7f9f2] transition-transform duration-300"
                      style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      aria-hidden
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 2v10M2 7h10" stroke="#142e2a" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 pr-10 font-ui text-[14px] leading-[22px] text-[#142e2a]/70">
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
    </section>
  );
}
