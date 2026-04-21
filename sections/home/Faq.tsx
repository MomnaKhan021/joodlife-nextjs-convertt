"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { useState } from "react";

const FAQS = [
  {
    q: "How does Jood's weight-loss actually work?",
    a: "Jood combines clinically proven GLP-1 medication with personalized coaching, ongoing clinical support, and evidence-based nutrition and movement guidance to help you achieve lasting results.",
  },
  {
    q: "Is the medication safe and evidence-based?",
    a: "Yes. All medications are MHRA/GPhC licensed and prescribed by UK-registered clinicians after reviewing your full health assessment.",
  },
  {
    q: "What if I miss an injection?",
    a: "Contact our 24/7 clinical team and they'll advise you on the safest way to get back on schedule — it's never a problem we can't solve.",
  },
  {
    q: "What is included with my purchase?",
    a: "Your plan includes the medication, ongoing clinical support, a personalized care plan, and free next-day discreet delivery.",
  },
  {
    q: "Can I pause or cancel my subscription?",
    a: "Yes — you're always in control. You can pause or cancel at any time from your account dashboard.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section aria-label="FAQ" className="w-full bg-white py-14 md:py-[80px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-8 px-6 md:gap-10 md:px-[60px]">
        <Reveal as="div">
          <h2 className="text-center font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Frequently asked{" "}
            <em className="font-serif italic font-normal">questions</em>
          </h2>
        </Reveal>

        <Reveal as="div" delay={100} className="w-full max-w-[750px]">
          <ul className="flex w-full flex-col gap-3 md:gap-4">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <li
                  key={i}
                  className="overflow-hidden rounded-xl border border-[#142E2A]/15 bg-white transition-colors duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
                  >
                    <span className="font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[22px]">
                      {f.q}
                    </span>
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center transition-transform duration-300 ease-out"
                      style={{
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden
                    >
                      <Image
                        src="/assets/figma/faq-plus.svg"
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7"
                      />
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 font-ui text-[14px] leading-[22px] text-[#142e2a]/75 md:px-6 md:pb-6 md:text-[15.5px] md:leading-[24px]">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <a
          href="#get-started"
          className="inline-flex h-[50px] cursor-pointer items-center justify-center rounded-lg bg-[#142e2a] px-12 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
        >
          Get started
        </a>
      </div>
    </section>
  );
}
