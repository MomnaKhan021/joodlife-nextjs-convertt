import Image from "next/image";
import Link from "next/link";

import { CATEGORIES, type Category } from "@/lib/categories";

/**
 * Gateway hero — Figma "Home Page (Desktop)" node 67:1820.
 *
 * The home page is a gateway: the hero presents the three care
 * categories as cards that each route to a dedicated sub-page.
 *
 *  ┌──────────────────────────┬───────────────┐
 *  │  Weight loss (primary,    │ Men's health  │
 *  │  dark-green) → /weight-   │ → /erectile-… │
 *  │  loss + eligibility CTA   ├───────────────┤
 *  │                           │ Women's health│
 *  │                           │ → /period-…   │
 *  └──────────────────────────┴───────────────┘
 *
 * Desktop: 2-column grid (≈1.85fr primary / 1fr stacked pair).
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
      <span className="font-inter text-[13px] leading-none text-white">
        4.4 <span className="text-white/80">(50+) Reviews</span>
      </span>
    </span>
  );
}

function CheckBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15">
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden>
          <path
            d="M1 4.5L4 7.5L10 1.5"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-ui text-[15px] leading-snug text-[#d3dabe] md:text-[16px]">
        {children}
      </span>
    </li>
  );
}

/** Primary (weight-loss) card — dark green, fills the left column. */
function PrimaryCard({ category }: { category: Category }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#142e2a_0%,#42746d_100%)] p-6 md:p-8 lg:min-h-[450px] lg:bg-[linear-gradient(225deg,#42746d_0%,#142e2a_100%)] lg:p-10">
      {/* Desktop: the two-women cutout fills the card; women sit on the right
          (transparent left lets the green show), text overlays the left. */}
      <div aria-hidden className="absolute inset-0 z-0 hidden lg:block">
        <Image
          src="/assets/figma/hero-two-women-desktop.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="760px"
          className="object-cover object-bottom"
        />
      </div>

      {/* Text — constrained to the left half on desktop so it never overlaps
          the women. */}
      <div className="relative z-10 flex flex-col gap-5 lg:max-w-[54%]">
        <TrustpilotRow />
        <h1 className="max-w-[15ch] font-display text-[34px] font-medium leading-[1.05] tracking-[-0.03em] text-white md:text-[48px] md:leading-[1.06]">
          Weight loss, now
          <br />
          <em className="font-serif font-normal italic">with Wegovy Pills</em>
        </h1>
        <ul className="flex flex-col gap-2.5">
          {category.bullets.map((b) => (
            <CheckBullet key={b}>{b}</CheckBullet>
          ))}
        </ul>
        <div className="mt-2">
          <Link
            href={category.href}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-7 font-ui text-[15px] font-semibold text-[#142e2a] shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
          >
            Check Your Eligibility
          </Link>
        </div>
      </div>

      {/* Mobile: the centred two-women cutout sits full-width BELOW the text. */}
      <div className="relative z-10 mt-6 h-[260px] w-full lg:hidden">
        <Image
          src="/assets/figma/hero-two-women-mobile.png"
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

/** Secondary category card — dark green, person photo on the right, CTA. */
function SecondaryCard({ category }: { category: Category }) {
  const title = category.cardTitle.replace(/\n/g, " ");
  return (
    <div className="group relative flex min-h-[208px] flex-1 flex-col justify-between overflow-hidden rounded-[24px] bg-[#f7f9f2] p-6">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[50%]">
        <Image
          src={category.cardImage}
          alt={category.imageAlt}
          fill
          quality={90}
          sizes="(max-width: 1024px) 50vw, 260px"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#f7f9f2] via-[#f7f9f2]/70 to-transparent"
        />
      </div>

      <div className="relative z-10 max-w-[62%]">
        <p className="font-ui text-[14px] font-normal text-[#142e2a]/65 md:text-[15px]">
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
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#0c2421]"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}

export default function HeroGateway() {
  return (
    <section aria-label="Explore our treatments" className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-5 pt-4 md:px-10 md:pt-6 lg:px-[60px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[857fr_447fr]">
          <PrimaryCard category={CATEGORIES["weight-loss"]} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SecondaryCard category={CATEGORIES["erectile-dysfunction"]} />
            <SecondaryCard category={CATEGORIES["period-delay"]} />
          </div>
        </div>
      </div>
    </section>
  );
}
