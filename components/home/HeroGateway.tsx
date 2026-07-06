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
 * Desktop: 2-column grid (857 / 447 ≈ 1.85fr / 1fr, 16px gap).
 * Mobile: the three cards stack full-width.
 */

function TrustpilotRow() {
  return (
    <span className="inline-flex items-center gap-1.5 text-white">
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
      className="group relative flex flex-col overflow-hidden rounded-[24px] p-6 md:p-8 lg:min-h-[450px] lg:p-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(20,46,42,0.92) 0%, rgba(20,46,42,0.4) 46%, rgba(20,46,42,0) 66%), linear-gradient(135deg, #42746d 0%, #142e2a 100%)",
      }}
    >
      {/* Desktop: two-women transparent cutout, anchored bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[58%] lg:block"
      >
        <Image
          src="/assets/home/hero-two-women.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="500px"
          className="object-contain object-bottom"
        />
      </div>

      {/* Text — left half on desktop so it never overlaps the women. */}
      <div className="relative z-10 flex flex-col gap-5 lg:max-w-[48%]">
        <TrustpilotRow />
        <h1 className="font-display text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-white sm:text-[36px] lg:text-[48px] lg:leading-[1.15]">
          Weight loss, now{" "}
          <em className="font-serif font-normal italic">with Wegovy Pills</em>
        </h1>
        <ul className="flex flex-col gap-3">
          <CheckBullet>Lose up to 27% body weight</CheckBullet>
          <CheckBullet>Plans tailored to you</CheckBullet>
          <CheckBullet>Guidance for lasting results</CheckBullet>
        </ul>
        <div className="mt-2">
          <Link
            href={isReturningPatient ? "/reorder" : `/consultation?product=${category.key}`}
            className="btn-cta inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-7 font-ui text-[16px] font-semibold text-[#142e2a] shadow-sm hover:bg-[#f0f4ea]"
          >
            {isReturningPatient ? "Reorder" : "Check Your Eligibility"}
          </Link>
        </div>
      </div>

      {/* Mobile: the centred two-women cutout sits full-width BELOW the text. */}
      <div className="relative z-10 mt-6 h-[270px] w-full lg:hidden">
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

/** Secondary category card — cream, transparent person cutout on the right, CTA. */
function SecondaryCard({ category }: { category: Category }) {
  const title = category.cardTitle.replace(/\n/g, " ");
  return (
    <div className="group relative flex min-h-[208px] flex-1 flex-col justify-between overflow-hidden rounded-[24px] border border-[#142e2a]/10 bg-[#f7f9f2] p-6">
      {/* Transparent cut-out portrait, anchored bottom-right. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[52%] md:w-[50%]">
        <Image
          src={category.cardImage}
          alt={category.imageAlt}
          fill
          quality={95}
          sizes="(max-width: 1024px) 55vw, 300px"
          className="object-contain object-right-bottom"
        />
      </div>

      <div className="relative z-10 max-w-[56%]">
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
