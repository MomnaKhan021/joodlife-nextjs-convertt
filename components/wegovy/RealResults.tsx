import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "Real results with Wegovy" — Figma node 1:1948.
 * Two-column: left dark-green stat panel, right lifestyle image with a
 * "Health gains beyond numbers" overlay card.
 */

export default function RealResults() {
  return (
    <section
      aria-label="Real results with Wegovy"
      className="w-full bg-white"
    >
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-6 py-14 md:px-10 md:py-16 lg:grid-cols-2 lg:px-[60px] lg:py-[80px]">
        {/* Left — solid purple #4a4074 per Figma, carousel image overlay */}
        <Reveal as="div" className="h-full">
          <div className="relative flex h-full min-h-[460px] flex-col justify-between gap-6 overflow-hidden rounded-[24px] bg-[#4a4074] py-10 px-5 md:min-h-[560px]">
            {/* Carousel image — blurred outdoor scene sits on top of purple like Figma */}
            <Image
              src="/assets/wegovy/why-runner.png"
              alt=""
              fill
              aria-hidden
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover object-center opacity-50 mix-blend-luminosity"
            />
            {/* Subtle dark veil so text stays legible */}
            <div className="absolute inset-0 bg-[#4a4074]/40" aria-hidden />

            <h2 className="relative font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
              Real Results{" "}
              <span className="font-serif italic font-normal">With Wegovy</span>
            </h2>

            {/* ~14% frosted panel */}
            <div className="relative rounded-2xl border border-white/20 bg-white/[0.06] p-5 md:p-6">
              <span className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 7l7 7 4-4 7 7" stroke="#142e2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 17v-4h-4" stroke="#142e2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-ui text-[18px] text-white/85 md:text-[22px]">Up to</span>
              </span>
              <p className="mt-1 font-display text-[80px] font-medium leading-none text-white md:text-[120px] lg:text-[150px]">
                ~14%
              </p>
              <p className="mt-3 font-ui text-[18px] font-semibold text-white/90 md:text-[25px]">
                average body weight loss at 64 weeks*
              </p>
              <p className="mt-3 font-ui text-[11px] leading-[16px] text-white/55">
                *Based on a manufacturer 64-week medical study of 307 adults
                living with obesity, or with overweight and at least one
                weight-related medical problem, along with a reduced-calorie diet
                and increased physical activity. Adults taking Wegovy® Pill lost
                an average of 14% body weight (~33 lb) compared with people taking
                placebo (not on medicine) who lost 2.4% (~6 lb).
              </p>
            </div>

            {/* 1-in-4 frosted panel */}
            <div className="relative flex items-start gap-3 rounded-2xl border border-white/20 bg-white/[0.06] px-5 py-4">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3" stroke="#142e2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.5 14h9" stroke="#142e2a" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="16" cy="6" r="1" fill="#142e2a" />
                  <circle cx="18" cy="9" r="0.8" fill="#142e2a" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[18px] font-semibold leading-tight text-white md:text-[22px]">
                  1 in 4 participants
                </p>
                <p className="font-ui text-[22px] font-semibold leading-[1.1] text-white/80 md:text-[34px]">
                  lost 20% or more of their body weight
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right — image with overlay card */}
        <Reveal as="div" delay={120} className="h-full">
          <div className="relative h-full min-h-[460px] overflow-hidden rounded-[24px] md:min-h-[560px]">
            <Image
              src="/assets/wegovy/results-woman.png"
              alt="Women walking outdoors in a sunlit field"
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-4 bottom-4 flex items-start gap-3 rounded-2xl bg-[#142e2a]/85 px-5 py-4 backdrop-blur-sm">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" stroke="#142e2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-ui text-[18px] font-semibold text-white md:text-[22px]">
                  Health gains beyond numbers
                </p>
                <p className="mt-1 font-ui text-[13px] leading-[19.5px] text-white/80 md:text-[16.3px]">
                  The Wegovy Pill contains semaglutide — the same active
                  ingredient as the injectable Wegovy pen — now in a once-daily
                  oral form. Like the pen, it supports cardiometabolic health
                  alongside weight loss.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
