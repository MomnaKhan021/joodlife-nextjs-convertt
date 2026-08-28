import Image from "next/image";
import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";
import { SecondaryCard } from "@/components/home/HeroGateway";

/**
 * Foundayo gateway hero — Figma "Home Page - Hero - Next.js", node 1:59.
 *
 *  ┌──────────────────────────┬───────────────┐
 *  │  Foundayo tablet (peach   │ Men's health  │
 *  │  card) + pill artwork     │ → /erectile-… │
 *  │  → Explore Foundayo       ├───────────────┤
 *  │                           │ Women's health│
 *  └──────────────────────────┴───────────────┘
 *
 * Desktop: same 2-column gateway grid as HeroGateway (whose SecondaryCard is
 * reused for the right column); the primary card swaps the green weight-loss
 * panel for the peach Foundayo announcement. Mobile: cards stack, the pill
 * sits below the CTA, and the three features form divided columns.
 *
 * Pill artwork lives at /assets/home/foundayo-pill.png (exported from the
 * Figma design — transparent PNG).
 */

const FEATURES = [
  { icon: TabletIcon, label: "Oral tablet\ntreatment" },
  { icon: SyringeIcon, label: "No\ninjections" },
  { icon: HeartIcon, label: "Clinician\nsupport" },
] as const;

function FoundayoCard() {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden rounded-[24px] bg-[#fdf0ea] p-6 md:p-8 lg:min-h-[450px] lg:justify-center lg:p-12">
      {/* Copy — left column on desktop; the pill stays right of it. */}
      <div className="relative z-10 flex flex-col gap-4 lg:max-w-[62%]">
        <span className="inline-flex w-fit items-center rounded-md bg-[#f7d3c1] px-3 py-1 font-ui text-[13px] font-semibold text-[#142e2a]">
          New
        </span>

        <h1 className="font-display text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-[#142e2a] sm:text-[36px] lg:text-[36px] lg:leading-[1.1] min-[1400px]:text-[42px]">
          A new tablet option
          <br />
          <em className="font-serif font-normal italic text-[#d8836a]">
            for weight management
          </em>
        </h1>

        <p className="max-w-[44ch] font-ui text-[13px] leading-[1.55] text-[#142e2a]/80 md:text-[15px]">
          Foundayo&reg; (oral tirzepatide) is a new weight management treatment
          option, available following clinician assessment.
        </p>

        {/* Features — desktop: icon left of a two-line label; mobile: three
            divided columns with the icon above the label (per the Figma). */}
        <ul className="grid grid-cols-3 divide-x divide-[#142e2a]/15 lg:flex lg:gap-8 lg:divide-x-0">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <li
                key={i}
                className="flex flex-col items-start gap-2 px-3 first:pl-0 last:pr-0 lg:flex-row lg:items-center lg:px-0"
              >
                <span className="text-[#d8836a]">
                  <Icon />
                </span>
                <span className="whitespace-pre-line font-ui text-[12px] font-medium leading-[1.25] text-[#142e2a] md:text-[13px]">
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-1">
          <Link
            href="/weight-loss"
            className="btn-cta inline-flex h-[48px] items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421]"
          >
            Explore Foundayo
          </Link>
        </div>
      </div>

      {/* Desktop: pill artwork — right half of the card, vertically centred. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-6 right-6 z-0 hidden w-[40%] lg:block"
      >
        <Image
          src="/assets/home/foundayo-pill.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="480px"
          className="object-contain object-center"
        />
      </div>

      {/* Mobile: pill below the CTA. */}
      <div className="relative mt-6 h-[260px] w-full lg:hidden">
        <Image
          src="/assets/home/foundayo-pill.png"
          alt="Foundayo oral tablet"
          fill
          priority
          quality={90}
          sizes="90vw"
          className="object-contain object-center"
        />
      </div>
    </div>
  );
}

export default function FoundayoHero() {
  return (
    <section
      aria-label="Explore our treatments"
      className="w-full overflow-x-hidden bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-5 pt-6 md:px-10 md:pt-[30px] lg:px-[60px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.85fr_1fr]">
          <div className="min-w-0">
            <FoundayoCard />
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SecondaryCard category={CATEGORIES["erectile-dysfunction"]} />
            <SecondaryCard category={CATEGORIES["period-delay"]} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Coral outline feature icons (match the Figma) ---- */

function TabletIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
      <path d="M12 8.5v7" strokeLinecap="round" />
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6l-9 9-3 .8.8-3 9-9z" />
      <path d="M15 4.5l4.5 4.5M8 12l4 4M4 20l2-2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z" />
    </svg>
  );
}
