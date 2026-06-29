import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * CTA banner — Figma node 141:2876 (Section).
 *
 * 1440×442 white outer; inner card 1320×430, bg #f7f9f2, radius 24.
 * Three column layout:
 *   - Left (425px): icon (48×48) + "Take the first step / toward a
 *     better you" (48px Gilroy-SemiBold, italic on second line) +
 *     small description.
 *   - Middle: portrait photo (overlapping ellipse decoration behind).
 *   - Right: outlined "GET STARTED" button (NOT filled), 200×50, r=8.
 */
export default function CtaBanner({ isReturningPatient }: { isReturningPatient?: boolean }) {
  return (
    <section
      aria-label="Call to action"
      className="w-full bg-white pb-6 pt-14 md:pb-8 md:pt-16 lg:pb-10 lg:pt-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-[24px] bg-[#f7f9f2] md:h-[430px]"
        >
          {/* Decorative ellipse behind the image */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[442px] w-[438px] -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <Image
              src="/assets/figma/cta-ellipse.svg"
              alt=""
              fill
              sizes="438px"
              className="object-contain opacity-90"
            />
          </div>

          <div className="relative grid h-full grid-cols-1 items-center md:grid-cols-[425px_minmax(0,1fr)_auto] md:gap-10 md:px-[60px]">
            {/* LEFT — icon + headline + copy */}
            <div className="relative z-10 flex flex-col items-start gap-5 px-6 pt-10 pb-4 md:gap-6 md:px-0 md:py-0">
              {/* Heart-in-square icon (48×48) */}
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#142e2a]">
                <svg
                  width="22"
                  height="21"
                  viewBox="0 0 22 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M11 19s-7.5-4.5-7.5-10.5C3.5 5.46 5.96 3 9 3c1.55 0 3.13.76 4 2.07C13.87 3.76 15.45 3 17 3c3.04 0 5.5 2.46 5.5 5.5C22.5 14.5 11 19 11 19z"
                    fill="#ffffff"
                  />
                </svg>
              </span>

              <h2 className="max-w-[425px] font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
                Take the first step{" "}
                <em className="font-serif italic font-normal">
                  toward a better you
                </em>
              </h2>

              <p className="max-w-[360px] font-ui text-[15px] leading-[22px] tracking-[-0.02em] text-[#142e2a]/75 md:text-[16.3px] md:leading-[20px]">
                Simple support for your goals, your routine, and your
                confidence.
              </p>
            </div>

            {/* MIDDLE — portrait image */}
            <div className="relative order-3 h-[300px] w-full md:order-2 md:h-full md:min-h-[430px]">
              <Image
                src="/assets/figma/cta-bg.png"
                alt="Happy person smiling"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                quality={95}
                className="object-cover object-[center_20%] md:object-[center_center]"
                priority={false}
              />
            </div>

            {/* RIGHT — outlined Get Started button */}
            <div className="relative z-10 order-2 flex w-full items-center justify-start px-6 pb-10 md:order-3 md:justify-end md:px-0 md:py-0">
              <a
                href={isReturningPatient ? "/reorder" : "/consultation"}
                className="inline-flex h-[50px] w-full max-w-[200px] cursor-pointer items-center justify-center rounded-lg border border-[#142e2a]/40 bg-white px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-[#142e2a] transition-colors duration-200 hover:border-[#142e2a] hover:bg-[#142e2a] hover:text-white md:text-[14px]"
              >
                {isReturningPatient ? "Reorder" : "Get started"}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
