import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import {
  TransformationCard,
  ExpertGuidanceCard,
} from "@/sections/home/JourneyPlan";

/**
 * Weight-loss home section — Figma "Home Page (Desktop)" Component 292
 * (node 67:1897). One dark-green rounded block with three parts:
 *
 *   1. Centered hero — "Lose weight safely, with expert support" over a
 *      laughing portrait, decorative wave behind, Get Started / Learn more.
 *   2. "Introducing Wegovy Pills" detail card — left copy + two bullets +
 *      "How Wegovy Works", right portrait with a floating proof card.
 *   3. Two cards — "It's more than treatment, it's transformation" and
 *      "Continuous, expert guidance" (reused from JourneyPlan).
 */

const ACCENT = "#b4ff9f";

function WaveLine() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1320 160"
      preserveAspectRatio="none"
      className="pointer-events-none absolute left-0 top-[120px] hidden h-[160px] w-full opacity-30 md:block"
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

function WegovyBullet({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 6L9 17l-5-5"
            stroke={ACCENT}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className="font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-white">
          {title}
        </span>
        <span className="font-ui text-[13px] font-normal leading-[18px] tracking-[-0.01em] text-white/65">
          {copy}
        </span>
      </span>
    </li>
  );
}

export default function WeightLossPreview() {
  return (
    <section
      aria-label="Weight loss — Lose weight safely with expert support"
      className="w-full bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 md:px-10 md:py-6 lg:px-[60px]">
        <div className="relative overflow-hidden rounded-[28px] bg-[#142e2a] px-5 pb-8 pt-12 md:px-12 md:pb-12 md:pt-16 lg:px-16">
          {/* faint dot pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #dff49f 1.5px, transparent 1.5px)",
              backgroundSize: "120px 120px",
            }}
          />

          {/* ───────── PART 1 — centered hero ───────── */}
          <Reveal as="div" className="relative z-10 flex flex-col items-center">
            <WaveLine />
            <h2 className="relative z-10 max-w-[18ch] text-center font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
              Lose weight safely,{" "}
              <em className="font-serif font-normal italic">
                with expert support
              </em>
            </h2>

            {/* Portrait */}
            <div className="relative z-10 mt-6 h-[280px] w-full max-w-[460px] md:mt-8 md:h-[360px]">
              <Image
                src="/assets/figma/journey-woman-desktop.png"
                alt="Smiling weight-loss patient"
                fill
                priority
                quality={90}
                sizes="(max-width: 768px) 90vw, 460px"
                className="object-contain object-bottom"
              />
            </div>

            {/* Buttons */}
            <div className="relative z-20 -mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/weight-loss#assessment"
                className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#d3dabe]"
              >
                Get Started
              </Link>
              <Link
                href="/weight-loss"
                className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/40 px-7 font-ui text-[16.3px] font-semibold tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-white/10"
              >
                Learn more
              </Link>
            </div>
          </Reveal>

          {/* ───────── PART 2 — Introducing Wegovy Pills ───────── */}
          <Reveal
            as="div"
            delay={100}
            className="relative z-10 mt-12 grid items-center gap-8 rounded-[24px] bg-white/[0.04] p-6 md:mt-16 md:grid-cols-[1.15fr_1fr] md:gap-10 md:p-10"
          >
            <div className="flex flex-col gap-6">
              <h3 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-white md:text-[34px]">
                Introducing{" "}
                <span style={{ color: ACCENT }}>Wegovy Pills</span> care in the
                UK{" "}
                <em className="font-serif font-normal italic">
                  through Jood Life
                </em>
              </h3>
              <p className="max-w-[440px] font-ui text-[15px] font-normal leading-[22px] tracking-[-0.01em] text-white/70 md:text-[16.3px]">
                A new option for weight loss, backed by{" "}
                <span style={{ color: ACCENT }}>UK-registered prescribers</span>{" "}
                and ongoing support.
              </p>

              <ul className="flex flex-col gap-4">
                <WegovyBullet
                  title="Now available in the UK"
                  copy="Wegovy® care introduced by Jood."
                />
                <WegovyBullet
                  title="Clinician-led care you can trust"
                  copy="Reviewed by UK registered prescribers to ensure it's right for you."
                />
              </ul>

              <Link
                href="/weight-loss"
                className="inline-flex h-[50px] w-fit items-center justify-center rounded-lg border border-white/30 bg-black/20 px-7 font-ui text-[14px] font-semibold tracking-[-0.01em] text-white backdrop-blur-md transition-colors duration-200 hover:bg-black/35"
              >
                How Wegovy Works
              </Link>
            </div>

            {/* Right portrait with floating proof card */}
            <div className="relative h-[300px] w-full overflow-hidden rounded-[20px] md:h-[360px]">
              <Image
                src="/assets/figma/happy-woman-2.png"
                alt="Patient reassured by clinician-led care"
                fill
                quality={90}
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-cover object-top"
              />
              <div className="absolute bottom-4 right-4 max-w-[180px] rounded-2xl bg-white/90 px-4 py-3 backdrop-blur-md">
                <p className="font-ui text-[12px] font-semibold leading-[16px] text-[#142e2a]">
                  Trusted, clinician-led Wegovy® care
                </p>
              </div>
            </div>
          </Reveal>

          {/* ───────── PART 3 — Transformation + Expert guidance ───────── */}
          <Reveal
            as="div"
            delay={150}
            className="relative z-10 mt-8 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6"
          >
            <TransformationCard />
            <ExpertGuidanceCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
