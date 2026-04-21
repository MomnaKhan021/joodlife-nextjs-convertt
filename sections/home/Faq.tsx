"use client";

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
    <section aria-label="FAQ" className="w-full bg-white py-16 md:py-[60px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-10 px-6 md:px-[60px]">
        <Reveal as="div">
          <h2 className="text-center font-display text-[32px] leading-[40px] font-semibold text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Frequently asked <em className="font-serif italic font-normal">questions</em>
          </h2>
        </Reveal>

        <Reveal as="div" delay={100} className="w-full max-w-[750px]">
        <ul className="flex w-full flex-col gap-4">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li
                key={i}
                className="rounded-lg bg-white ring-1 ring-[#142e2a]/10"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                >
                  <span className="font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
                    {f.q}
                  </span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f7f9f2]">
                    <span
                      className="font-ui text-[16px] text-[#142e2a] transition-transform"
                      style={{
                        transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                      }}
                    >
                      +
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 font-ui text-[15px] leading-[22px] text-[#142e2a]/80">
                    {f.a}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        </Reveal>

        <a
          href="#get-started"
          className="inline-flex h-[50px] items-center justify-center rounded-lg bg-[#142e2a] px-12 font-ui text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0c2421]"
        >
          Get started
        </a>
      </div>
    </section>
  );
}
