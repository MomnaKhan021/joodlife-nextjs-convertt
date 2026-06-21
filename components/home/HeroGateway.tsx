import Image from "next/image";
import Link from "next/link";

import { CATEGORIES, type Category } from "@/lib/categories";

/**
 * Gateway hero — Figma "Home Page (Desktop)" node 1:2403.
 *
 * The home page is a gateway: the hero presents the three care
 * categories as cards that each route to a dedicated sub-page.
 *
 *  ┌──────────────────────────┬───────────────┐
 *  │  Weight loss (primary,    │ Men's health  │
 *  │  dark-green) → /weight-   │ → /erectile-… │
 *  │  loss                     ├───────────────┤
 *  │                           │ Women's health│
 *  │                           │ → /period-…   │
 *  └──────────────────────────┴───────────────┘
 *
 * Desktop: 2-column grid (≈1.85fr primary / 1fr stacked pair).
 * Mobile: the three cards stack full-width.
 */

function TrustpilotRow() {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-white/95 px-2.5 py-1.5 text-[#142e2a]">
      <Image
        src="/assets/icons/trustpilot-logo-only.svg"
        alt="Trustpilot"
        width={72}
        height={18}
        className="h-[18px] w-auto"
      />
      <Image
        src="/assets/figma/trustpilot-stars.svg"
        alt=""
        width={84}
        height={16}
        className="h-4 w-auto"
        aria-hidden
      />
      <span className="font-ui text-[13px] font-semibold leading-none">4.4</span>
      <span className="font-ui text-[12px] leading-none text-[#142e2a]/70">(50+) Reviews</span>
    </span>
  );
}

function CheckBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Image
        src="/assets/figma/hero-red-tick.png"
        alt=""
        width={24}
        height={24}
        className="h-6 w-6 shrink-0"
        aria-hidden
      />
      <span className="font-ui text-[16.3px] font-medium leading-[20px] tracking-[-0.02em] text-[#d3dabe]">
        {children}
      </span>
    </li>
  );
}

/** Primary (weight-loss) card — dark green, fills the left column. */
function PrimaryCard({ category }: { category: Category }) {
  const [line1, line2] = category.cardTitle.split("\n");
  return (
    <Link
      href={category.href}
      aria-label={`${category.eyebrow}: ${line1?.replace(",", "")} ${line2 ?? ""} — view treatment`}
      className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#142e2a] p-6 md:min-h-[450px] md:p-8 lg:p-10"
    >
      {/* Portrait — anchored bottom-right, behind the text on mobile */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[62%] md:w-[55%]">
        <Image
          src={category.cardImage}
          alt={category.imageAlt}
          fill
          priority
          quality={90}
          sizes="(max-width: 768px) 60vw, 480px"
          className="object-cover object-top"
        />
        {/* Left-to-right fade so the headline stays legible over the photo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#142e2a] via-[#142e2a]/55 to-transparent"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <TrustpilotRow />
        <h2 className="max-w-[15ch] font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.02em] text-white md:text-[48px]">
          {line1}
          <br />
          <em className="font-serif font-normal italic">{line2}</em>
        </h2>
        <ul className="flex flex-col gap-2.5">
          {category.bullets.map((b) => (
            <CheckBullet key={b}>{b}</CheckBullet>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-8 flex items-center">
        <span className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-7 font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 group-hover:bg-[#d3dabe]">
          Check Your Eligibility
        </span>
      </div>
    </Link>
  );
}

/** Secondary category card — cream, person photo on the right. */
function SecondaryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      aria-label={`${category.eyebrow}: ${category.cardTitle.replace("\n", " ")} — view treatment`}
      className="group relative flex min-h-[200px] flex-1 flex-col justify-between overflow-hidden rounded-[24px] border border-[#142e2a]/12 bg-[#f7f9f2] p-6"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[52%]">
        <Image
          src={category.cardImage}
          alt={category.imageAlt}
          fill
          quality={90}
          sizes="(max-width: 1024px) 50vw, 240px"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#f7f9f2] via-[#f7f9f2]/70 to-transparent"
        />
      </div>

      <div className="relative z-10 max-w-[60%]">
        <p className="font-ui text-[16.3px] font-normal text-[#142e2a]">
          {category.eyebrow}
        </p>
        <h3 className="mt-1 whitespace-pre-line font-display text-[24px] font-semibold leading-[1.08] tracking-[-0.01em] text-[#09140E] md:text-[28px]">
          {category.cardTitle}
        </h3>
      </div>

      <div className="relative z-10 mt-6 flex items-center">
        <span className="inline-flex h-[42px] items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white transition-colors duration-200 group-hover:bg-[#0c2421]">
          Get Started
        </span>
      </div>
    </Link>
  );
}

export default function HeroGateway() {
  return (
    <section aria-label="Explore our treatments" className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-10 md:pt-6 lg:px-[60px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.85fr_1fr]">
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
