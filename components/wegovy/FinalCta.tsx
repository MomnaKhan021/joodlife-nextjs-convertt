import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Closing CTA — Figma node 1:2132 (top card, above the footer).
 * Cream card: left copy + button, right portrait image.
 */

export default function FinalCta() {
  return (
    <section
      aria-label="Ready to start the Wegovy Pill"
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div">
          <div className="grid grid-cols-1 overflow-hidden rounded-[24px] bg-[#f7f9f2] md:grid-cols-[1fr_minmax(0,360px)]">
            <div className="flex flex-col justify-center gap-5 px-8 py-12 md:px-12">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#142e2a]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 21s-7-4.35-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3.2 1.2 4 2.4C10.8 7.2 12 6 14 6c3.5 0 5 3.5 3.5 6.5C19 16.65 12 21 12 21z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <h2 className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
                Ready to start the{" "}
                <span className="font-serif italic font-normal">Wegovy Pill?</span>
              </h2>
              <p className="max-w-[440px] font-ui text-[15px] leading-[22px] text-[#142e2a]/70">
                A 2-minute clinical intake. No obligation. No payment until
                you’re approved.
              </p>
              <a
                href="/consultation"
                className="inline-flex h-[52px] w-fit items-center justify-center rounded-lg bg-[#142e2a] px-10 font-ui text-[13px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
              >
                Get Started
              </a>
            </div>
            <div className="relative min-h-[320px] w-full md:min-h-[440px]">
              <Image
                src="/assets/wegovy/cta-woman.png"
                alt="Woman looking up, smiling"
                fill
                sizes="(max-width:768px) 100vw, 360px"
                className="object-cover object-top"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
