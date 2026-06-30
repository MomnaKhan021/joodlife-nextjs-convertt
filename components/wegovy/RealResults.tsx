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
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-6 px-6 md:px-10 lg:grid-cols-2 lg:px-[60px]">
        {/* Left — stat panel over a blurred grassy backdrop */}
        <Reveal as="div" className="h-full">
          <div className="relative flex h-full min-h-[460px] flex-col justify-between gap-6 overflow-hidden rounded-[24px] p-8 md:min-h-[560px] md:p-10">
            {/* Blurred grass image (different from the right photo) + Figma
                linear gradient #FFFFFF 0% → #0B3B3C 100% */}
            <Image
              src="/assets/wegovy/why-runner.png"
              alt=""
              fill
              aria-hidden
              sizes="(max-width:1024px) 100vw, 50vw"
              className="scale-125 object-cover object-center blur-lg"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(20,60,57,0.45) 45%, rgba(11,59,60,0.9) 100%)",
              }}
            />

            <h2 className="relative font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[40px]">
              Real Results{" "}
              <span className="font-serif italic font-normal">With Wegovy</span>
            </h2>

            {/* ~14% frosted panel */}
            <div className="relative rounded-2xl border border-white/20 bg-[#13302a]/35 p-5 backdrop-blur-md md:p-6">
              <span className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 7l7 7 4-4 7 7" stroke="#142e2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 17v-4h-4" stroke="#142e2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-ui text-[15px] text-white/85">Up to</span>
              </span>
              <p className="mt-1 font-display text-[60px] font-semibold leading-none text-white md:text-[80px]">
                ~14%
              </p>
              <p className="mt-3 font-ui text-[15px] text-white/90">
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
            <div className="relative flex items-start gap-3 rounded-2xl border border-white/20 bg-[#13302a]/35 px-5 py-4 backdrop-blur-md">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3" stroke="#142e2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.5 14h9" stroke="#142e2a" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="16" cy="6" r="1" fill="#142e2a" />
                  <circle cx="18" cy="9" r="0.8" fill="#142e2a" />
                </svg>
              </span>
              <div>
                <p className="font-display text-[22px] font-semibold leading-tight text-white md:text-[26px]">
                  1 in 4 participants
                </p>
                <p className="font-ui text-[14px] text-white/80">
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
                <p className="font-ui text-[15px] font-semibold text-white">
                  Health gains beyond numbers
                </p>
                <p className="mt-1 font-ui text-[12.5px] leading-[18px] text-white/80">
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
