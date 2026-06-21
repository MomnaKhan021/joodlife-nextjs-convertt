import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

/**
 * Period-delay home section — Figma "Home Page (Desktop)" Component 291
 * (node 67:2060). Rose/pink theme. Parts:
 *
 *   1. Centered hero — "Adjust your periods / on your schedule" over the
 *      clock+calendar portrait, wave behind, Get Started / Learn more.
 *   2. Split card — left description, right "Understand Your Cycle and
 *      Hormone Health" with portrait, hormone tag chips, Check Your Eligibility.
 */

const HORMONE_TAGS = [
  "Hormone Balance",
  "Progesterone",
  "Follicle",
  "Cycle Tracker",
  "Menstrual Health",
  "Hormones",
  "Thyroid-Stimulating Hormone",
];

function WaveLine() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1320 160"
      preserveAspectRatio="none"
      className="pointer-events-none absolute left-0 top-[130px] hidden h-[160px] w-full opacity-40 md:block"
    >
      <path
        d="M0 90 C 220 20, 440 150, 660 80 S 1100 20, 1320 90"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.4"
      />
      {[110, 400, 660, 920, 1210].map((cx) => (
        <circle key={cx} cx={cx} cy="85" r="4" fill="#ffffff" />
      ))}
    </svg>
  );
}

export default function PeriodDelayPreview() {
  return (
    <section
      aria-label="Women's health — Adjust your periods on your schedule"
      className="w-full bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 md:px-10 md:py-6 lg:px-[60px]">
        <div
          className="relative overflow-hidden rounded-[28px] px-5 pb-8 pt-12 md:px-12 md:pb-12 md:pt-16 lg:px-16"
          style={{
            background:
              "linear-gradient(180deg, #e8568a 0%, #e98caf 55%, #eda9c4 100%)",
          }}
        >
          {/* ───────── PART 1 — centered hero ───────── */}
          <Reveal as="div" className="relative z-10 flex flex-col items-center">
            <WaveLine />
            <h2 className="relative z-10 max-w-[18ch] text-center font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[56px]">
              Adjust your periods{" "}
              <em className="font-serif font-normal italic">
                on your schedule
              </em>
            </h2>

            <div className="relative z-10 mt-6 h-[300px] w-full max-w-[460px] md:mt-8 md:h-[380px]">
              <Image
                src="/assets/category/period-hero.png"
                alt="Woman planning her cycle with a clock and calendar"
                fill
                quality={90}
                sizes="(max-width: 768px) 90vw, 460px"
                className="object-contain object-bottom"
              />
            </div>

            <div className="relative z-20 -mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/period-delay#assessment"
                className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#ffeaf2]"
              >
                Get Started
              </Link>
              <Link
                href="/period-delay"
                className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/60 px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-white/10"
              >
                Learn more
              </Link>
            </div>
          </Reveal>

          {/* ───────── PART 2 — split: description + cycle card ───────── */}
          <Reveal
            as="div"
            delay={120}
            className="relative z-10 mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6"
          >
            {/* Left — description */}
            <div className="flex min-h-[320px] flex-col justify-center rounded-[24px] bg-white/[0.14] p-6 backdrop-blur-sm md:p-10">
              <p className="max-w-[420px] font-ui text-[16px] font-medium leading-[24px] tracking-[-0.01em] text-white md:text-[18px] md:leading-[28px]">
                Take control of your period safely and reliably. Whether it&rsquo;s
                for holidays, weddings, or important events, Norethisterone is
                clinically approved and delivered discreetly to help you stay in
                control.
              </p>
            </div>

            {/* Right — Understand Your Cycle */}
            <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[24px] bg-[#7a1538]/30 p-6 backdrop-blur-sm md:p-8">
              <h3 className="relative z-10 max-w-[60%] font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-white md:text-[30px]">
                Understand Your Cycle and Hormone Health
              </h3>

              {/* portrait bottom-right */}
              <div className="pointer-events-none absolute bottom-0 right-0 z-0 h-[80%] w-[48%]">
                <Image
                  src="/assets/category/pd-card.png"
                  alt="Woman tracking her cycle and hormone health"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 50vw, 260px"
                  className="object-contain object-bottom"
                />
              </div>

              {/* hormone tag chips */}
              <ul className="relative z-10 mt-5 flex max-w-[70%] flex-wrap gap-2">
                {HORMONE_TAGS.map((t) => (
                  <li
                    key={t}
                    className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-3 py-1.5 font-ui text-[12px] font-medium text-white/90"
                  >
                    {t}
                  </li>
                ))}
              </ul>

              <Link
                href="/period-delay#assessment"
                className="relative z-10 mt-auto inline-flex h-[48px] w-fit items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold tracking-[-0.01em] text-white transition-colors duration-200 hover:bg-[#0c2421]"
              >
                Check Your Eligibility
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
