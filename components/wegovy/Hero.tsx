import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import {
  WEGOVY_DEFAULT,
  type WegovyHero,
} from "@/lib/wegovyContentTypes";

/**
 * Wegovy Pills landing hero — Figma node 1:1506 (desktop) / 1:2362 (mobile).
 *
 * Full-bleed lifestyle photo with a dark-green gradient overlay; all copy is
 * white. Desktop anchors the gradient to the left (text on the left); mobile
 * anchors it to the bottom (text over the lower, darker part of the photo).
 */

function CheckBadge() {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#00b67a]">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2.5 6.2l2.2 2.2L9.5 3.6"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function HeroCopy({ c }: { c: WegovyHero }) {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Image
          src="/assets/icons/trustpilot-logo-dark.svg"
          alt="Trustpilot"
          width={74}
          height={18}
          className="h-[18px] w-auto brightness-0 invert"
        />
        <Image
          src="/assets/icons/trustpilot-stars.svg"
          alt="4.4 stars"
          width={86}
          height={16}
          className="h-4 w-auto"
        />
        <span className="font-ui text-[14.2px] text-white/90">
          {c.reviewsLabel}
        </span>
      </div>

      <h1 className="font-display text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[32px] md:text-[40px] lg:text-[46px] lg:leading-[1.1]">
        {c.title}
        <br />
        <span className="font-serif italic font-normal">{c.titleAccent}</span>
      </h1>
      <p className="mt-4 max-w-[480px] font-ui text-[15px] leading-[1.5] text-white/85 sm:text-[16px] md:text-[17px] md:leading-[1.5]">
        {c.body}
      </p>

      {c.ctaLabel ? (
        <a
          href={c.ctaHref}
          className="mt-7 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-white px-9 font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-[#142e2a] transition-colors hover:bg-[#daffe0] sm:w-auto"
        >
          {c.ctaLabel}
        </a>
      ) : null}

      <ul className="mt-7 flex flex-col gap-3">
        {c.stats.map((s) => (
          <li key={s} className="flex items-center gap-3">
            <CheckBadge />
            <span className="font-ui text-[14px] leading-[20px] text-white/90 md:text-[15px]">
              {s}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Hero({
  content = WEGOVY_DEFAULT.hero,
}: {
  content?: WegovyHero;
}) {
  return (
    <section
      aria-label="Wegovy Pills — a new way to lose weight"
      className="relative flex min-h-[620px] w-full items-end overflow-hidden bg-[#142e2a] md:min-h-[700px] md:items-center"
    >
      {/* Background photo */}
      <Image
        src={content.image}
        alt={content.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[70%_top] md:object-right"
      />

      {/* Mobile gradient — dark at the bottom under the copy */}
      <div
        className="absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(20,46,42,0.1) 0%, rgba(20,46,42,0.55) 45%, rgba(20,46,42,0.95) 100%)",
        }}
      />
      {/* Desktop gradient — dark on the left under the copy */}
      <div
        className="absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(20,46,42,0.95) 0%, rgba(20,46,42,0.85) 34%, rgba(20,46,42,0.4) 56%, rgba(20,46,42,0) 78%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-12 md:px-10 md:py-20 lg:px-[60px] lg:py-[110px]">
        <Reveal as="div" className="max-w-[720px]">
          <HeroCopy c={content} />
        </Reveal>
      </div>
    </section>
  );
}
