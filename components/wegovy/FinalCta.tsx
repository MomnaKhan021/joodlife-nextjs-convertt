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
          <div className="relative grid grid-cols-1 overflow-hidden rounded-[24px] bg-[#f7f9f2] md:h-[430px] md:grid-cols-[425px_minmax(0,1fr)_auto] md:items-center md:gap-10 md:px-[60px]">
            {/* LEFT — icon + headline + copy */}
            <div className="relative z-10 flex flex-col items-start gap-5 px-6 pt-10 pb-4 md:gap-6 md:px-0 md:py-0">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#142e2a]">
                <svg width="22" height="21" viewBox="0 0 22 21" fill="none" aria-hidden>
                  <path d="M11 19s-7.5-4.5-7.5-10.5C3.5 5.46 5.96 3 9 3c1.55 0 3.13.76 4 2.07C13.87 3.76 15.45 3 17 3c3.04 0 5.5 2.46 5.5 5.5C22.5 14.5 11 19 11 19z" fill="#ffffff" />
                </svg>
              </span>
              <h2 className="max-w-[425px] font-display text-[32px] font-semibold leading-[38px] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
                Ready to start the{" "}
                <em className="font-serif italic font-normal">Wegovy Pill?</em>
              </h2>
              <p className="max-w-[360px] font-ui text-[15px] leading-[22px] tracking-[-0.02em] text-[#142e2a]/75">
                A 2-minute clinical intake. No obligation. No payment until
                you&apos;re approved.
              </p>
            </div>

            {/* MIDDLE — portrait image */}
            <div className="relative order-3 h-[300px] w-full md:order-2 md:h-full md:min-h-[430px]">
              <Image
                src="/assets/wegovy/cta-woman.png"
                alt="Woman looking up, smiling"
                fill
                sizes="(max-width:768px) 100vw, 600px"
                quality={95}
                className="object-cover object-[center_top]"
              />
            </div>

            {/* RIGHT — outlined Get Started button */}
            <div className="relative z-10 order-2 flex w-full items-center justify-start px-6 pb-10 md:order-3 md:justify-end md:px-0 md:py-0">
              <a
                href="/consultation"
                className="inline-flex h-[50px] w-full max-w-[200px] cursor-pointer items-center justify-center rounded-lg border border-[#142e2a]/40 bg-white px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-[#142e2a] transition-colors duration-200 hover:border-[#142e2a] hover:bg-[#142e2a] hover:text-white md:text-[14px]"
              >
                Get Started
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
