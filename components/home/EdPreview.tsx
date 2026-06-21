import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

/**
 * Erectile-dysfunction home section — Figma "Home Page (Desktop)"
 * Component 290 (node 67:2021). Blue theme. Three parts:
 *
 *   1. Centered hero — "Take Control of Erectile Health / Safely and
 *      Confidently" over a portrait, wave behind, Get Started / Learn more.
 *   2. Tinted card — left copy + right pill visual + Get Started.
 *   3. Two cards — "What are your goals?" (photo + option chips) and a
 *      patient testimonial quote.
 */

const GOALS = [
  "Address erectile difficulties",
  "Improve sexual confidence",
  "All the above",
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

export default function EdPreview() {
  return (
    <section
      aria-label="Men's health — Take control of erectile health"
      className="w-full bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 md:px-10 md:py-6 lg:px-[60px]">
        <div
          className="relative overflow-hidden rounded-[28px] px-5 pb-8 pt-12 md:px-12 md:pb-12 md:pt-16 lg:px-16"
          style={{
            background:
              "linear-gradient(180deg, #1a8ec1 0%, #4eabd2 60%, #6cb9da 100%)",
          }}
        >
          {/* ───────── PART 1 — centered hero ───────── */}
          <Reveal as="div" className="relative z-10 flex flex-col items-center">
            <WaveLine />
            <h2 className="relative z-10 max-w-[20ch] text-center font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[56px]">
              Take Control of Erectile Health{" "}
              <em className="font-serif font-normal italic">
                Safely and Confidently
              </em>
            </h2>

            <div className="relative z-10 mt-6 h-[300px] w-full max-w-[440px] md:mt-8 md:h-[380px]">
              <Image
                src="/assets/category/ed-hero.png"
                alt="Man confident after erectile-dysfunction treatment"
                fill
                quality={90}
                sizes="(max-width: 768px) 90vw, 440px"
                className="object-contain object-bottom"
              />
            </div>

            <div className="relative z-20 -mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/erectile-dysfunction#assessment"
                className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#c7eeff]"
              >
                Get Started
              </Link>
              <Link
                href="/erectile-dysfunction"
                className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/50 px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-white/10"
              >
                Learn more
              </Link>
            </div>
          </Reveal>

          {/* ───────── PART 2 — tinted detail card ───────── */}
          <Reveal
            as="div"
            delay={100}
            className="relative z-10 mt-12 grid items-center gap-8 rounded-[24px] bg-white/[0.12] p-6 md:mt-16 md:grid-cols-[1.3fr_1fr] md:gap-10 md:p-10"
          >
            <p className="max-w-[460px] font-ui text-[18px] font-medium leading-[26px] tracking-[-0.02em] text-white md:text-[22px] md:leading-[30px]">
              Take control of erectile health safely and discreetly. Clinically
              approved treatments are delivered to your door, helping you regain
              confidence and performance.
            </p>

            <div className="flex items-center justify-between gap-6">
              {/* Pill visual */}
              <div
                aria-hidden
                className="relative h-[120px] w-[180px] shrink-0"
              >
                <div className="absolute left-1/2 top-1/2 h-[64px] w-[150px] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full bg-gradient-to-br from-white to-[#e4f4fb] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]">
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#142e2a]/10" />
                </div>
              </div>
              <Link
                href="/erectile-dysfunction#assessment"
                className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-lg bg-[#142e2a] px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-[#0c2421]"
              >
                Get Started
              </Link>
            </div>
          </Reveal>

          {/* ───────── PART 3 — goals + testimonial ───────── */}
          <Reveal
            as="div"
            delay={150}
            className="relative z-10 mt-8 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6"
          >
            {/* Goals card */}
            <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#0d2f40]/35 p-6 backdrop-blur-sm md:p-8">
              <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[55%]">
                <Image
                  src="/assets/category/ed-card.png"
                  alt="Man considering his treatment goals"
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 50vw, 300px"
                  className="object-cover object-center"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-[#1a6f9c] via-[#1a6f9c]/50 to-transparent"
                />
              </div>
              <h3 className="relative z-10 font-display text-[24px] font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-[25px]">
                What are your goals?
              </h3>
              <ul className="relative z-10 mt-6 flex flex-col items-start gap-2.5">
                {GOALS.map((g) => (
                  <li
                    key={g}
                    className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 font-ui text-[14px] font-medium text-[#142e2a]"
                  >
                    {g}
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial card */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-[24px] bg-[#0d2f40]/35 p-6 backdrop-blur-sm md:p-8">
              <p className="font-ui text-[20px] font-semibold leading-[28px] tracking-[-0.02em] text-white md:text-[25px] md:leading-[32px]">
                &ldquo;This treatment completely restored my confidence. I no
                longer worry about performance, and I feel in control.&rdquo;
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <div>
                  <p className="font-ui text-[16.3px] font-semibold text-white">
                    Jordan, 42
                  </p>
                  <p className="font-ui text-[14px] font-normal text-white/70">
                    2 month completed
                  </p>
                </div>
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
