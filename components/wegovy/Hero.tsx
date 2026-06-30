import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Wegovy Pills landing hero — Figma node 1:1506.
 *
 * Full-bleed lifestyle photo with a left-anchored gradient so the dark-green
 * headline, Trustpilot rating, CTA and the three proof bullets stay legible.
 */

const STATS = [
  "16.6% average weight loss in 64 weeks",
  "MHRA approved for use in UK on 11 June 2026",
  "Once-daily oral semaglutide",
];

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

export default function Hero() {
  return (
    <section
      aria-label="Wegovy Pills — a new way to lose weight"
      className="relative w-full overflow-hidden bg-[#142e2a]"
    >
      {/* Background photo */}
      <Image
        src="/assets/wegovy/hero.png"
        alt="Woman smiling outdoors holding a glass of water"
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      {/* Left-anchored gradient for text legibility */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(20,46,42,0.92) 0%, rgba(20,46,42,0.78) 38%, rgba(20,46,42,0.18) 66%, rgba(20,46,42,0) 88%)",
        }}
      />

      {/* New treatment banner */}
      <div className="relative z-10 w-full border-b border-white/15">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-3 md:px-10 lg:px-16">
          <p className="font-ui text-[13px] font-medium tracking-[-0.01em] text-white/90 md:text-[14px]">
            New Wegovy Pills treatment in the UK
          </p>
          <a
            href="/consultation"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-white px-5 font-ui text-[12px] font-semibold uppercase tracking-[0.02em] text-[#142e2a] transition-colors hover:bg-[#daffe0]"
          >
            Get started
          </a>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 md:px-10 md:py-24 lg:px-16 lg:py-28">
        <Reveal as="div" className="max-w-[620px]">
          <div className="mb-5 flex items-center gap-2">
            <Image
              src="/assets/icons/trustpilot-logo-dark.svg"
              alt="Trustpilot"
              width={80}
              height={20}
              className="h-5 w-auto brightness-0 invert"
            />
            <Image
              src="/assets/icons/trustpilot-stars.svg"
              alt="4.4 stars"
              width={86}
              height={16}
              className="h-4 w-auto"
            />
            <span className="font-ui text-[14px] text-white/90">
              4.4 (50+) Reviews
            </span>
          </div>

          <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-[64px] md:leading-[1.04]">
            Uk First.{" "}
            <span className="font-serif italic font-normal">Wegovy Pills</span>
          </h1>
          <p className="mt-3 font-display text-[22px] font-medium leading-[1.2] text-white md:text-[28px]">
            A New Way To Lose Weight
          </p>
          <p className="mt-5 max-w-[520px] font-ui text-[15px] leading-[24px] text-white/85 md:text-[16px]">
            Introducing Wegovy® pills in the UK, with clinician-led support
            tailored to you. Same proven formula. No needles. Just real results.
          </p>

          <a
            href="/consultation"
            className="mt-8 inline-flex h-[54px] items-center justify-center rounded-lg bg-white px-9 font-ui text-[14px] font-semibold uppercase tracking-[-0.01em] text-[#142e2a] transition-colors hover:bg-[#daffe0]"
          >
            Get Started Today
          </a>

          <ul className="mt-9 flex flex-col gap-3">
            {STATS.map((s) => (
              <li key={s} className="flex items-center gap-3">
                <CheckBadge />
                <span className="font-ui text-[14px] leading-[20px] text-white/90 md:text-[15px]">
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
