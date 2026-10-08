import Link from "next/link";
import Image from "next/image";

import { LANDER_CTA_HREF, TRUSTPILOT_URL } from "@/lib/landerContentTypes";

/**
 * Shared bits for the ads landing page (/a7g64pt), built from the
 * "Ads Landing - Joodlife - Next Js" Figma and styled like /foundayo: the
 * live site's three fonts only — Gilroy (font-display) headings, ITC
 * Clearface italic (font-serif) accents, Outfit (font-ui) for everything
 * else — scroll reveals and the same hover lift. Copy and pictures come from
 * the CMS (lib/landerContentTypes.ts).
 */

/** Folder holding the images exported from the Figma file. */
export const LP_ASSETS = "/assets/lp-weight-loss";

/** Outer page gutter: 16px on phones, 80px at the 1440 design width. */
export const LP_GUTTER = "px-4 lg:px-12 xl:px-20";

/** Body copy — the /foundayo scale: 16.3/19.5, slightly tight. */
export const LP_BODY = "font-ui text-[16px] leading-[22px] tracking-[-0.3px] md:text-[16.3px] md:leading-[22px]";

/** The brand green gradient used by the hero and the step labels. */
export const LP_GRADIENT =
  "linear-gradient(237.58deg, rgb(66, 116, 109) 3.59%, rgb(20, 46, 42) 86.2%)";

/**
 * "Start My Weight-Loss Journey" — 285×50 on desktop (radius 8, 16.3/19.5
 * medium), full width on phones, lifting on hover like /foundayo's buttons.
 * An empty label hides it.
 */
export function LpCta({
  tone = "dark",
  label,
  href = LANDER_CTA_HREF,
  className = "",
}: {
  tone?: "dark" | "light";
  label: string;
  href?: string;
  className?: string;
}) {
  if (!label.trim()) return null;
  const colours =
    tone === "light"
      ? "bg-white text-[#142e2a] hover:bg-[#daffe0]"
      : "border border-[#0c2421] bg-[#142e2a] text-white hover:bg-[#0c2421]";
  return (
    <Link
      href={href || LANDER_CTA_HREF}
      className={`fnd-lift inline-flex h-[50px] w-full items-center justify-center whitespace-nowrap rounded-[8px] px-[24px] font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.3px] transition-colors duration-200 lg:w-[285px] ${colours} ${className}`}
    >
      {label}
    </Link>
  );
}

/** Section heading: Gilroy semibold with a Clearface italic tail. */
export function LpHeading({
  lead,
  accent,
  className = "",
  as: Tag = "h2",
  weight = "semibold",
}: {
  lead: string;
  accent: string;
  className?: string;
  as?: "h1" | "h2";
  /** Gilroy SemiBold almost everywhere; the Journey heading is Gilroy Medium. */
  weight?: "semibold" | "medium";
}) {
  return (
    <Tag
      // !font-semibold: globals.css sets h1–h4 to 500 outside Tailwind's
      // layers, which beats a plain font-semibold. Figma is Gilroy SemiBold.
      className={`font-display text-[36px] ${weight === "medium" ? "!font-medium" : "!font-semibold"} leading-[43.2px] tracking-[-1.2px] text-[#142e2a] md:text-[48px] md:leading-[52px] ${className}`}
    >
      {lead}
      {accent ? (
        <>
          {" "}
          <em className="font-serif font-normal italic">{accent}</em>
        </>
      ) : null}
    </Tag>
  );
}

/** "Step 1" style label with the brand gradient clipped to the text. */
export function LpStepLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-clip-text font-ui text-[14px] font-medium uppercase leading-[20px] text-transparent"
      style={{ backgroundImage: LP_GRADIENT }}
    >
      {children}
    </span>
  );
}

/**
 * Wraps a Trustpilot badge in a link to Jood's Trustpilot page, the same
 * link the home hero, product pages and checkout use.
 */
export function TrustpilotLink({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={TRUSTPILOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Read our reviews on Trustpilot (opens in a new tab)"
      className={`transition-opacity hover:opacity-80 ${className}`}
    >
      {children}
    </a>
  );
}

/** Green tick in a lime circle + "Verified review". */
export function LpVerified({ size = 14 }: { size?: 13 | 14 }) {
  return (
    <span className="flex items-center gap-[6px]">
      <Image src={`${LP_ASSETS}/verified.svg`} alt="" width={16} height={16} unoptimized />
      <span
        className={`font-ui text-[#13332b] ${
          size === 13 ? "text-[13px] font-medium leading-[18.9px]" : "text-[14px] leading-[20.9px]"
        }`}
      >
        Verified review
      </span>
    </span>
  );
}

/**
 * Trustpilot's own five green star tiles (the 86×16 "Img" group in
 * Figma), laid out from the five exported tiles.
 */
export function LpTrustpilotStars({ tile = 16 }: { tile?: number }) {
  const gap = tile * 0.2;
  return (
    <span className="flex items-center" style={{ gap }} aria-label="5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <Image key={i} src={`${LP_ASSETS}/tp-g${i}.svg`} alt="" width={tile} height={tile} unoptimized />
      ))}
    </span>
  );
}

/**
 * Whether next/image should skip its optimiser for a CMS image. Local
 * /assets files and Vercel Blob uploads are optimised; any other pasted
 * https URL (an unknown host next.config doesn't allow) and SVGs are served
 * as-is so they can't break the page.
 */
export function rawImage(src: string) {
  if (/\.svg(\?|$)/i.test(src)) return true;
  return /^https?:\/\//.test(src) && !/\.public\.blob\.vercel-storage\.com\//.test(src);
}
