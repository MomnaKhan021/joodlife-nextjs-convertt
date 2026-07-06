import Image from "next/image";
import Link from "next/link";

import { CATEGORIES, type Category } from "@/lib/categories";

/**
 * Gateway hero — Figma "Home Page (Desktop) 2026-04-20", node 142:1591.
 *
 *  ┌──────────────────────────┬───────────────┐
 *  │  Weight loss (primary,    │ Men's health  │
 *  │  green gradient) → CTA    │ → /erectile-… │
 *  │  + two-women cutout       ├───────────────┤
 *  │                           │ Women's health│
 *  └──────────────────────────┴───────────────┘
 *
 * Desktop: 2-column grid (857 / 447 ≈ 1.85fr / 1fr, 16px gap). Card art
 * fills the full card height (Figma STRETCH), anchored bottom-right.
 * Mobile: the three cards stack full-width.
 */

function TrustpilotRow() {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-white">
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M10 0l2.45 6.18L19 6.7l-4.97 4.06L15.6 17 10 13.4 4.4 17l1.57-6.24L1 6.7l6.55-.52L10 0z"
          fill="#00b67a"
        />
      </svg>
      <span className="font-ui text-[15px] font-semibold leading-none text-white">
        Trustpilot
      </span>
      <Image
        src="/assets/figma/trustpilot-stars.svg"
        alt="Rated 4.4 out of 5"
        width={84}
        height={16}
        className="ml-1 h-4 w-auto"
      />
      <span className="font-ui text-[13px] leading-none text-white">
        4.4 <span className="text-white/80">(50+) Reviews</span>
      </span>
    </span>
  );
}

function CheckBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <Image
        src="/assets/home/tick.png"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0"
        aria-hidden
      />
      <span className="font-ui text-[15px] leading-snug text-white md:text-[16px]">
        {children}
      </span>
    </li>
  );
}

/** Primary (weight-loss) card — green gradient + two-women cutout. */
function PrimaryCard({
  category,
  isReturningPatient,
}: {
  category: Category;
  isReturningPatient?: boolean;
}) {
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-[24px] p-6 md:p-8 lg:min-h-[450px] lg:justify-center lg:p-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(20,46,42,0.94) 0%, rgba(20,46,42,0.5) 44%, rgba(20,46,42,0) 64%), linear-gradient(135deg, #42746d 0%, #142e2a 100%)",
      }}
    >
      {/* Desktop: two-women cutout fills the full card height, bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[56%] lg:block"
      >
        <Image
          src="/assets/home/hero-two-women.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="600px"
          className="object-cover object-bottom"
        />
      </div>

      {/* Text — left half on desktop so it never overlaps the women. */}
      <div className="relative z-10 flex flex-col gap-4 lg:max-w-[47%]">
        <TrustpilotRow />
        <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white sm:text-[38px] lg:text-[46px] lg:leading-[1.08]">
          Medical Weight Loss,
          <br />
          <em className="font-serif font-normal italic">Tailored to You.</em>
        </h1>
        <p className="max-w-[42ch] font-ui text-[14px] leading-[1.5] text-white/85 md:text-[15px]">
          Personalised treatment plans from UK clinicians, with access to the
          latest prescription weight-loss injections and tablets—all supported
          throughout your journey.
        </p>
        <ul className="flex flex-col gap-2.5">
          <CheckBullet>Personalised treatment plans</CheckBullet>
          <CheckBullet>Injections &amp; tablets available</CheckBullet>
          <CheckBullet>Ongoing clinician support</CheckBullet>
        </ul>
        <div className="mt-1">
          <Link
            href={isReturningPatient ? "/reorder" : `/consultation?product=${category.key}`}
            className="btn-cta inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-7 font-ui text-[16px] font-semibold text-[#142e2a] shadow-sm hover:bg-[#f0f4ea]"
          >
            {isReturningPatient ? "Reorder" : "Check Your Eligibility"}
          </Link>
        </div>
      </div>

      {/* Mobile: the centred two-women cutout sits full-width BELOW the text. */}
      <div className="relative z-10 mt-6 h-[300px] w-full lg:hidden">
        <Image
          src="/assets/home/hero-two-women.png"
          alt={category.imageAlt}
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-contain object-bottom"
        />
      </div>
    </div>
  );
}

/** Secondary category card — cream, person cutout fills the right side. */
function SecondaryCard({ category }: { category: Category }) {
  const title = category.cardTitle.replace(/\n/g, " ");
  return (
    <div className="group relative flex min-h-[210px] flex-1 flex-col justify-between overflow-hidden rounded-[24px] border border-[#142e2a]/10 bg-[#f7f9f2] p-6">
      {/* Person cutout — fills the full card height on the right. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[54%]">
        <Image
          src={category.cardImage}
          alt={category.imageAlt}
          fill
          quality={95}
          sizes="(max-width: 1024px) 55vw, 300px"
          className="object-cover object-bottom"
        />
      </div>

      <div className="relative z-10 max-w-[52%]">
        <p className="font-ui text-[14px] font-normal text-[#142e2a]/65 md:text-[16px]">
          {category.eyebrow}
        </p>
        <h2 className="mt-1.5 whitespace-pre-line font-display text-[24px] font-semibold leading-[1.08] tracking-[-0.01em] text-[#0a140f] md:text-[28px]">
          {category.cardTitle}
        </h2>
      </div>

      <div className="relative z-10 mt-5">
        <Link
          href={category.href}
          aria-label={`${category.eyebrow}: ${title} — get started`}
          className="btn-cta inline-flex h-10 items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white hover:bg-[#0c2421]"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}

export default function HeroGateway({ isReturningPatient }: { isReturningPatient?: boolean }) {
  return (
    <section
      aria-label="Explore our treatments"
      className="w-full overflow-x-hidden bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-5 pt-6 md:px-10 md:pt-[30px] lg:px-[60px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.85fr_1fr]">
          <div className="min-w-0">
            <PrimaryCard
              category={CATEGORIES["weight-loss"]}
              isReturningPatient={isReturningPatient}
            />
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
