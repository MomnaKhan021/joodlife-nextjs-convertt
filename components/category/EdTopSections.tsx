import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import TestimonialCarousel from "@/components/category/TestimonialCarousel";
import EdTimeline from "@/components/category/EdTimeline";
import {
  ED_DEFAULT,
  type EdHeroContent,
  type EdJourneyContent,
} from "@/lib/edContentTypes";

/**
 * Top-of-page ED sections — Figma "Erectile dysfunction" (node 18:811):
 *   • EdHero    — photo banner with Trustpilot, headline, checklist, CTAs
 *   • EdJourney — teal "What to expect in your journey" timeline, the
 *                 thumbs-up cut-out, the treatment card, goals + testimonial
 *
 * Both are fully responsive: stacked on mobile, the Figma layout on desktop.
 */

/* ── Trustpilot rating row ───────────────────────────────────────────── */
function Trustpilot({
  label,
  dark = false,
}: {
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 font-ui text-[13px] ${
        dark ? "text-white" : "text-[#142e2a]"
      }`}
    >
      <span className="font-semibold">
        <span className="text-[#00b67a]">★</span> Trustpilot
      </span>
      <span className="flex gap-0.5" aria-label="4.4 out of 5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#00b67a] text-[9px] text-white"
            aria-hidden
          >
            ★
          </span>
        ))}
      </span>
      <span
        className={
          dark ? "font-semibold text-white" : "font-semibold text-[#142e2a]"
        }
      >
        {label}
      </span>
    </div>
  );
}

/* ── 1. Hero photo banner ────────────────────────────────────────────── */
export function EdHero({
  content = ED_DEFAULT.hero,
}: {
  content?: EdHeroContent;
}) {
  return (
    <section
      aria-label="Erectile dysfunction treatment"
      className="w-full bg-white px-5 pt-4 md:px-10 md:pt-6 lg:px-[60px]"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[16px] md:rounded-[24px]">
          <Image
            src={content.image}
            alt={content.imageAlt}
            fill
            priority
            quality={85}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[64%_center]"
          />
          {/* Legibility gradient. Mobile: the copy spans most of the card, so
              a stronger, more even scrim keeps the white text readable over the
              bright part of the photo. Desktop: a left-weighted gradient that
              still reveals the man on the right. */}
          <div
            aria-hidden
            className="absolute inset-0 md:hidden"
            style={{
              background:
                "linear-gradient(165deg, rgba(6,20,26,0.86) 0%, rgba(6,20,26,0.6) 55%, rgba(6,20,26,0.78) 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(6,20,26,0.86) 0%, rgba(6,20,26,0.62) 40%, rgba(6,20,26,0.15) 66%, rgba(6,20,26,0) 82%)",
            }}
          />

          <div className="relative min-h-[440px] max-w-[640px] p-6 py-10 md:min-h-[560px] md:p-12">
            <Reveal as="div" direction="down">
              <Trustpilot label={content.reviewsLabel} dark />
            </Reveal>
            <Reveal as="div" delay={60}>
              <h1 className="mt-5 max-w-[16ch] font-display text-[32px] font-semibold leading-[1.16] tracking-[-0.025em] text-white md:text-[54px] md:leading-[1.08]">
                {content.title}{" "}
                <em className="font-serif font-normal italic">
                  {content.titleAccent}
                </em>
              </h1>
            </Reveal>
            <Reveal as="div" delay={140} className="mt-6">
              <ul className="flex flex-col gap-2.5">
                {content.checks.map((c, i) => (
                  <li key={i} className="flex items-center gap-2.5 font-ui text-[13.5px] text-white/90 md:text-[15px]">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1a8ec1] text-[10px] text-white">
                      ✓
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal as="div" delay={220} className="mt-7 flex flex-wrap gap-3">
              {content.ctaLabel ? (
                <Link
                  href={content.ctaHref}
                  className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 font-ui text-[14px] font-semibold text-[#142e2a] shadow-lg transition-colors hover:bg-white/90"
                >
                  {content.ctaLabel}
                </Link>
              ) : null}
              {content.secondaryLabel ? (
                <Link
                  href={content.secondaryHref}
                  className="btn-cta inline-flex h-12 items-center justify-center rounded-lg border border-white/70 bg-white/10 px-8 font-ui text-[14px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {content.secondaryLabel}
                </Link>
              ) : null}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. "What to expect in your journey" (teal) ──────────────────────── */
export function EdJourney({
  content = ED_DEFAULT.journey,
}: {
  content?: EdJourneyContent;
}) {
  return (
    <section
      aria-labelledby="ed-journey"
      className="w-full bg-white px-5 py-6 md:px-10 lg:px-[60px]"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div
          className="relative overflow-hidden rounded-[16px] px-6 pb-8 pt-10 md:rounded-[24px] md:px-12 md:pb-10 md:pt-14"
          style={{
            background:
              "linear-gradient(180deg, #3ba7d6 0%, #2f8fc0 52%, #2a83b4 100%)",
          }}
        >
          <div className="relative">
            <Reveal as="div">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3.5 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                {content.badge}
              </span>
              <h2
                id="ed-journey"
                className="mt-4 font-display text-[30px] font-semibold leading-[1.14] tracking-[-0.02em] text-white md:text-[40px] md:leading-[1.1]"
              >
                {content.heading}{" "}
                <em className="font-serif font-normal italic">
                  {content.headingAccent}
                </em>
              </h2>
            </Reveal>

            {/* Timeline — animated progress fill */}
            <EdTimeline stages={content.stages} />

            {/* Thumbs-up cut-out + wavy curve + CTAs */}
            <div className="relative mt-2 flex justify-center md:-mt-4">
              <svg
                aria-hidden
                viewBox="0 0 1200 260"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-[180px] w-full -translate-y-1/2 md:block"
              >
                <path
                  d="M0 210 C 220 210, 300 60, 520 90 S 900 220, 1200 60"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2.5"
                  strokeDasharray="2 11"
                  strokeLinecap="round"
                />
              </svg>

              <div className="relative h-[320px] w-[280px] md:h-[380px] md:w-[330px]">
                <Image
                  src={content.image}
                  alt={content.imageAlt}
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 280px, 330px"
                  className="object-contain object-bottom"
                />
              </div>

              <div className="absolute bottom-[14%] left-1/2 z-10 flex w-[92%] max-w-[360px] -translate-x-1/2 gap-2.5">
                {content.ctaLabel ? (
                  <Link
                    href={content.ctaHref}
                    className="btn-cta inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-white px-5 font-ui text-[13px] font-semibold text-[#142e2a] shadow-lg transition-colors hover:bg-white/90"
                  >
                    {content.ctaLabel}
                  </Link>
                ) : null}
                {content.secondaryLabel ? (
                  <Link
                    href={content.secondaryHref}
                    className="btn-cta inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-white/70 bg-white/10 px-5 font-ui text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    {content.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Treatment card */}
            <Reveal
              as="div"
              className="relative mt-2 grid items-center gap-5 rounded-[16px] bg-white/12 px-5 py-6 backdrop-blur-[14px] md:grid-cols-[1.4fr_auto_auto] md:gap-8 md:px-8 md:py-7"
            >
              <p className="max-w-[46ch] font-ui text-[14px] leading-relaxed text-white/90">
                {content.cardBody}
              </p>
              <div className="relative mx-auto h-[70px] w-[150px]">
                <Image
                  src={content.cardImage}
                  alt={content.cardImageAlt}
                  fill
                  quality={90}
                  sizes="150px"
                  className="object-contain"
                />
              </div>
              {content.cardCtaLabel ? (
                <Link
                  href={content.cardCtaHref}
                  className="btn-cta inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#0c2a3a] px-7 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#08222f] md:w-auto"
                >
                  {content.cardCtaLabel}
                </Link>
              ) : null}
            </Reveal>

            {/* Goals + testimonial */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
              <Reveal
                as="div"
                className="relative min-h-[360px] min-w-0 overflow-hidden rounded-[16px] md:min-h-[400px] md:rounded-[24px]"
              >
                <Image
                  src={content.goalsImage}
                  alt={content.goalsImageAlt}
                  fill
                  quality={90}
                  sizes="(max-width: 1024px) 90vw, 620px"
                  className="object-cover object-center"
                />
                <div aria-hidden className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 flex flex-col p-6 md:p-8">
                  <h3 className="font-display text-[24px] font-semibold leading-tight text-white md:text-[28px]">
                    {content.goalsHeading}
                  </h3>
                  <ul className="mt-auto flex flex-col items-start gap-2 md:mt-0 md:flex-1 md:items-end md:justify-center md:gap-2.5">
                    {content.goals.map((g, i) => (
                      <li
                        key={i}
                        className="max-w-full rounded-full bg-white/15 px-3 py-1.5 text-left font-ui text-[12px] font-medium text-white backdrop-blur-sm md:px-4 md:py-2 md:text-right md:text-[13px]"
                      >
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal as="div" delay={120} className="min-w-0">
                <TestimonialCarousel items={content.testimonials} />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
