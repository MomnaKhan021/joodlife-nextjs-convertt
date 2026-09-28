import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import AnimatedLbsBadge from "./AnimatedLbsBadge";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { WL_DEFAULT, type WlHeroContent } from "@/lib/weightLossContentTypes";

/**
 * Hero banner — matches Figma node 141:1688 (Updated Home Page,
 * 2026 Apr 22). Card: 1400×720, #142e2a, radius 24. Left text column
 * is 580 wide (NOT 720 — that was producing a wider, off-design
 * layout). Headline wraps naturally at 580px instead of being forced
 * onto one line; Figma renders it as two lines: "Innovative weight
 * loss," / "made just for you."
 *
 * Order of bullet rows per Figma (top-to-bottom):
 *   1. Lose up to 27% body weight
 *   2. Plans tailored to you
 *   3. Guidance for lasting results
 */

// Phones list the shipped bullets in a different order (per the Figma
// mobile frame). Once the list has been edited in the CMS, both sizes show
// the editor's order - there is no second list to keep in step.
const BULLETS_MOBILE = [
  "Lose up to 27% body weight",
  "Guidance for lasting results",
  "Plans tailored to you",
];

function TrustpilotRow({
  textClass = "text-white",
  label,
}: {
  textClass?: string;
  label: string;
}) {
  return (
    <a
      href="https://www.trustpilot.com/review/joodlife.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View Jood Life reviews on Trustpilot"
      className="inline-flex cursor-pointer items-center gap-2 rounded-md transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
    >
      <Image
        src="/assets/icons/trustpilot-logo-only.svg"
        alt="Trustpilot"
        width={80}
        height={20}
        className="h-[20px] w-auto"
      />
      <Image
        src="/assets/icons/trustpilot-stars.svg"
        alt="5 stars"
        width={86}
        height={16}
        className="h-[16px] w-auto"
      />
      <span
        className={`font-inter text-[14.2px] leading-[17px] tracking-[-0.03em] ${textClass}`}
      >
        {label}
      </span>
    </a>
  );
}

function TickBullet({ children }: { children: React.ReactNode }) {
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

export default function HeroBanner({
  content = WL_DEFAULT.hero,
}: {
  content?: WlHeroContent;
} = {}) {
  const shippedOrder =
    content.bullets.length === WL_DEFAULT.hero.bullets.length &&
    content.bullets.every((b, i) => b === WL_DEFAULT.hero.bullets[i]);
  const mobileBullets = shippedOrder ? BULLETS_MOBILE : content.bullets;

  return (
    <section
      aria-label="Hero"
      id="top"
      className="w-full bg-white px-0 pt-0 md:px-5 md:pt-5"
    >
      {/* Desktop — 1400×720 card */}
      <div className="hidden md:block">
        <div className="relative mx-auto h-[720px] w-full max-w-[1400px] overflow-hidden rounded-[24px] bg-[#142e2a]">
          <Reveal
            delay={0}
            as="div"
            className="relative flex h-full items-center pl-[60px] pr-[60px]"
          >
            {/* Left column — 580 wide per Figma */}
            <div className="relative z-10 flex w-[580px] max-w-[580px] flex-col items-start gap-7">
              <TrustpilotRow label={content.reviewsLabel} />

              <h1 className="font-display text-[60px] font-semibold leading-[68px] tracking-[-0.027em] text-white">
                {/* Figma wraps at two lines exactly. We force the first
                   line onto one line with whitespace-nowrap so the
                   slightly-wider PJS fallback (Gilroy-SemiBold is the
                   Figma face) doesn't push "loss," onto a third row. */}
                <span className="block whitespace-nowrap">
                  {content.titleLead}{" "}
                  <em className="font-serif italic font-normal tracking-[-0.02em]">
                    {content.titleAccent}
                  </em>
                </span>
                <span className="block">{content.titleTail}</span>
              </h1>

              <ul className="flex flex-col gap-3">
                {content.bullets.map((b) => (
                  <TickBullet key={b}>{b}</TickBullet>
                ))}
              </ul>

              <div className="mt-2 flex flex-wrap items-center gap-4">
                {/* Figma: primary 200×50, secondary 279×50 */}
                {content.ctaLabel ? (
                  <a
                    href={content.ctaHref}
                    className="btn-cta inline-flex h-[50px] w-[200px] items-center justify-center rounded-lg bg-white font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-[#142f2b] hover:bg-[#d3dabe]"
                  >
                    {content.ctaLabel}
                  </a>
                ) : null}
                {content.secondaryLabel ? (
                  <EligibilityCta
                    href={content.secondaryHref}
                    label={content.secondaryLabel}
                    className="btn-cta inline-flex h-[50px] w-[279px] items-center justify-center rounded-lg border border-white/40 bg-transparent font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-white hover:bg-white/10"
                  />
                ) : null}
              </div>
            </div>

            {/* Right column — portrait bleeds in from the right */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-[23px] h-[635px] w-[817px]"
            >
              <Image
                src={content.image}
                alt=""
                fill
                sizes="817px"
                quality={95}
                className="object-contain object-bottom"
                priority
              />
            </div>

            {/* Weight loss badge — 240×138, positioned per Figma */}
            <div className="absolute bottom-14 right-[82px] z-10">
              <AnimatedLbsBadge size="desktop" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Mobile */}
      <div className="px-4 pb-0 pt-3 md:hidden">
        <Reveal
          as="div"
          className="relative mx-auto flex w-full flex-col overflow-hidden rounded-[12px] bg-[#142e2a]"
        >
          <div className="flex flex-col gap-5 px-4 pt-6 pb-3">
            <TrustpilotRow label={content.reviewsLabel} />

            <h1 className="font-sofia text-[36px] font-medium leading-[40px] tracking-[-0.033em] text-white">
              {content.titleLead}{" "}
              <em className="font-serif italic font-normal">{content.titleAccent}</em>
              <br />
              {content.titleTail}
            </h1>

            <ul className="flex flex-col gap-2.5">
              {mobileBullets.map((b) => (
                <TickBullet key={b}>{b}</TickBullet>
              ))}
            </ul>

            {content.ctaLabel ? (
              <a
                href={content.ctaHref}
                className="btn-cta mt-1 inline-flex h-[50px] w-[239px] items-center justify-center rounded-lg bg-white font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-[#142f2b] hover:bg-[#d3dabe]"
              >
                {content.ctaLabel}
              </a>
            ) : null}
          </div>

          <div className="relative h-[320px] w-full">
            <Image
              src={content.mobileImage}
              alt=""
              fill
              sizes="100vw"
              quality={95}
              className="object-contain object-bottom"
              priority
            />
            <div className="absolute bottom-4 right-4 z-10">
              <AnimatedLbsBadge size="mobile" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
