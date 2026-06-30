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
        {/* Left — stat panel */}
        <Reveal as="div" className="h-full">
          <div
            className="flex h-full flex-col justify-between gap-8 rounded-[24px] p-8 md:p-10"
            style={{
              background:
                "linear-gradient(150deg, #1c3a34 0%, #142e2a 55%, #0c2421 100%)",
            }}
          >
            <div>
              <h2 className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[40px]">
                Real Results{" "}
                <span className="font-serif italic font-normal">With Wegovy</span>
              </h2>
              <div className="mt-8 flex items-end gap-3">
                <span className="font-ui text-[16px] text-white/70">Up to</span>
                <span className="font-display text-[64px] font-semibold leading-none text-[#b4ff9f] md:text-[80px]">
                  ~14%
                </span>
              </div>
              <p className="mt-2 font-ui text-[15px] text-white/85">
                average body weight loss at 64 weeks*
              </p>
            </div>

            <p className="font-ui text-[11px] leading-[16px] text-white/55">
              *Based on a manufacturer 64-week medical study of 307 adults living
              with obesity, or with overweight and at least one weight-related
              medical problem, along with a reduced-calorie diet and increased
              physical activity. Adults taking Wegovy® Pill lost an average of 14%
              body weight (~33 lb) compared with people taking placebo (not on
              medicine) who lost 2.4% (~6 lb).
            </p>

            <div className="rounded-2xl bg-white/10 px-5 py-4">
              <p className="font-display text-[22px] font-semibold leading-tight text-white md:text-[26px]">
                1 in 4 participants
              </p>
              <p className="font-ui text-[14px] text-white/80">
                lost 20% or more of their body weight
              </p>
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
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#00b67a]">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
