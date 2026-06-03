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

function CircleArrow({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const ring = tone === "dark" ? "border-white/70 text-white" : "border-[#142e2a]/30 text-[#142e2a]";
  return (
    <span
      aria-hidden
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-transparent transition-transform duration-300 ease-out group-hover:translate-x-1 ${ring} ${className}`}
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
        <path
          d="M1 7h15m0 0l-5-5m5 5l-5 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function TrustpilotRow() {
  return (
    <span className="inline-flex items-center gap-1.5 text-white">
      {/* Trustpilot star + wordmark (built in markup so the wordmark
          stays white/visible on the dark card) */}
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
        <h2 className="max-w-[15ch] font-display text-[36px] font-medium leading-[1.04] tracking-[-0.03em] text-white md:text-[50px] md:leading-[1.08]">
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

      <div className="relative z-10 mt-8 flex items-center justify-end">
        <CircleArrow tone="dark" />
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
      className="group relative flex min-h-[200px] flex-1 flex-col justify-between overflow-hidden rounded-[24px] bg-[#f7f9f2] p-6"
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

      <div className="relative z-10 max-w-[62%]">
        <p className="font-ui text-[14px] font-normal text-[#142e2a] md:text-[16px]">
          {category.eyebrow}
        </p>
        <h3 className="mt-1.5 whitespace-pre-line font-display text-[24px] font-semibold leading-[1.1] tracking-[-0.01em] text-[#0a140f] md:text-[28px]">
          {category.cardTitle}
        </h3>
      </div>

      <div className="relative z-10 mt-6">
        <CircleArrow tone="light" />
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
