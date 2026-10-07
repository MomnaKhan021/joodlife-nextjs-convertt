import Link from "next/link";
import Image from "next/image";

import { LANDER_CTA_HREF, TRUSTPILOT_URL } from "@/lib/landerContentTypes";

/**
 * Shared bits for the ads landing page (/weight-loss-lander), built from the
 * "Ads Landing - Joodlife - Next Js" Figma (frame "Landing page 2026, Oct 3"
 * desktop / "Oct 2" mobile). Figma's Saans and Poppins map to the site's
 * Outfit (font-ui), Gilroy-SemiBold to font-display, and ITC Clearface
 * italic to font-serif — the three brand fonts loaded in the site layout.
 * The words and pictures come from the CMS (lib/landerContentTypes.ts).
 */

/** Folder holding the images exported from the Figma file. */
export const LP_ASSETS = "/assets/lp-weight-loss";

/** Outer page gutter: 16px on phones, 80px at the 1440 design width. */
export const LP_GUTTER = "px-4 lg:px-12 xl:px-20";

/**
 * The Figma's one-off faces, loaded by the lander page itself (see
 * app/(site)/weight-loss-lander/page.tsx): Poppins for the Trustpilot
 * wordmark/score, Inter Tight + Instrument Serif for the expertise block
 * and the Journey button. Inline so they win over the font-ui body class.
 */
export const FONT_POPPINS: React.CSSProperties = { fontFamily: "var(--font-poppins), system-ui, sans-serif" };
export const FONT_INTER_TIGHT: React.CSSProperties = { fontFamily: "var(--font-inter-tight), system-ui, sans-serif" };
export const FONT_INSTRUMENT_SERIF: React.CSSProperties = {
  fontFamily: "var(--font-instrument-serif), Georgia, serif",
  fontStyle: "italic",
  fontWeight: 400,
};

/** The brand green gradient used by the hero and the step labels. */
export const LP_GRADIENT =
  "linear-gradient(237.58deg, rgb(66, 116, 109) 3.59%, rgb(20, 46, 42) 86.2%)";

/**
 * "Start My Weight-Loss Journey" — 285×50 on desktop (py 15, radius 8,
 * Saans 16.3/19.5 medium), full width on phones. An empty label hides it.
 */
export function LpCta({
  tone = "dark",
  label,
  href = LANDER_CTA_HREF,
  className = "",
  face = "saans",
}: {
  tone?: "dark" | "light";
  label: string;
  href?: string;
  className?: string;
  /** Figma sets every button in Saans except the Journey one (Inter Tight 15). */
  face?: "saans" | "interTight";
}) {
  if (!label.trim()) return null;
  const colours =
    tone === "light"
      ? "bg-white text-[#142e2a] hover:bg-[#f7f9f2]"
      : "bg-[#142e2a] text-white hover:bg-[#0c2421]";
  return (
    <Link
      href={href || LANDER_CTA_HREF}
      // Figma pads 50px a side with the label overflowing (whitespace-nowrap);
      // Outfit runs wider than Saans, so keep the 285 width and let the
      // label sit centred on one line instead.
      className={`inline-flex w-full items-center justify-center whitespace-nowrap rounded-[8px] px-[24px] font-medium transition-colors duration-200 lg:w-[285px] ${
        face === "interTight"
          ? "py-[15px] text-[15px] leading-[22.5px]"
          : "py-[15px] font-ui text-[16.3px] leading-[19.5px] tracking-[-0.32px]"
      } ${colours} ${className}`}
      style={face === "interTight" ? FONT_INTER_TIGHT : undefined}
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
      className={`font-display text-[32px] ${weight === "medium" ? "!font-medium" : "!font-semibold"} leading-[36px] tracking-[-1.2px] text-[#142e2a] lg:text-[48px] lg:leading-[52px] ${className}`}
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
