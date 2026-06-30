import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Closing CTA — Figma node 1:2132.
 * 1440×442 white outer; card 1320×430, bg #f7f9f2, r=24.
 * Absolute layout inside card:
 *   Left (425px): icon 48×48 + heading (Gilroy-SemiBold 48/52, ls=-1.2) + body (Saans 16.3/19.5 w380)
 *   Center: decorative ellipse 438×442 + portrait image 284×440 (right side)
 *   Right: outlined button 183×50, border=#0c2421, padding=(15,50), font Saans w570
 */
export default function FinalCta() {
  return (
    <section
      aria-label="Ready to start the Wegovy Pill"
      className="w-full bg-white pb-14 md:pb-16 lg:pb-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div">
          <div className="relative overflow-hidden rounded-[24px] bg-[#f7f9f2] md:h-[430px]">

            {/* Decorative ellipse — centered behind the image */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[442px] w-[438px] -translate-x-1/2 -translate-y-1/2 md:block"
            >
              <div className="h-full w-full rounded-full bg-white opacity-60" />
            </div>

            <div className="relative grid h-full grid-cols-1 items-center md:grid-cols-[425px_minmax(0,1fr)_auto] md:gap-10 md:px-[60px]">

              {/* LEFT — icon + headline + body */}
              <div className="relative z-10 flex flex-col items-start gap-5 px-6 pt-10 pb-4 md:gap-5 md:px-0 md:py-0">
                {/* Icon: 48×48, rounded-lg, dark green bg, white heart fill */}
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#142e2a]">
                  <svg width="22" height="21" viewBox="0 0 22 21" fill="none" aria-hidden>
                    <path
                      d="M11 19s-7.5-4.5-7.5-10.5C3.5 5.46 5.96 3 9 3c1.55 0 3.13.76 4 2.07C13.87 3.76 15.45 3 17 3c3.04 0 5.5 2.46 5.5 5.5C22.5 14.5 11 19 11 19z"
                      fill="#ffffff"
                    />
                  </svg>
                </span>

                {/* Heading: Gilroy-SemiBold 48px / lh 52px / ls -1.2px */}
                <h2 className="max-w-[425px] font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
                  Ready to start the{" "}
                  <em className="font-serif italic font-normal">Wegovy Pill?</em>
                </h2>

                {/* Body: Saans 16.3px / lh 19.5px / w380 / ls -0.32px */}
                <p className="max-w-[397px] font-ui text-[15px] leading-[19.5px] tracking-[-0.02em] text-[#142e2a]/70 md:text-[16.3px]">
                  A 2-minute clinical intake. No obligation. No payment until
                  you&apos;re approved.
                </p>
              </div>

              {/* MIDDLE — portrait image (284×440, right-aligned in column) */}
              <div className="relative order-3 h-[300px] w-full md:order-2 md:h-full md:min-h-[430px]">
                <Image
                  src="/assets/wegovy/cta-woman.png"
                  alt="Woman looking up, smiling"
                  fill
                  sizes="(max-width:768px) 100vw, 284px"
                  quality={95}
                  className="object-cover object-top"
                />
              </div>

              {/* RIGHT — outlined button: 183×50, border=#0c2421, px=50px, Saans w570 */}
              <div className="relative z-10 order-2 flex w-full items-center justify-start px-6 pb-10 md:order-3 md:justify-end md:px-0 md:py-0">
                <a
                  href="/consultation"
                  className="inline-flex h-[50px] w-full max-w-[183px] cursor-pointer items-center justify-center rounded-lg border border-[#0c2421] bg-white px-[50px] font-ui text-[14px] font-semibold tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#142e2a] hover:text-white"
                >
                  Get started
                </a>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
