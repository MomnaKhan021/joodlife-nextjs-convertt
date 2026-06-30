import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Wegovy Pills landing hero — Figma node 1:1506 (desktop) / 1:2362 (mobile).
 *
 * Desktop: full-bleed light lifestyle photo on the right, with the dark-green
 * headline / Trustpilot / CTA / proof bullets sitting on the lighter left side
 * over a soft cream gradient.
 * Mobile: photo stacks on top, copy sits below on white — matching the Figma
 * mobile frame.
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

function TrustRow() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Image
        src="/assets/icons/trustpilot-logo-dark.svg"
        alt="Trustpilot"
        width={74}
        height={18}
        className="h-[18px] w-auto"
      />
      <Image
        src="/assets/icons/trustpilot-stars.svg"
        alt="4.4 stars"
        width={86}
        height={16}
        className="h-4 w-auto"
      />
      <span className="font-ui text-[13px] text-[#142e2a]/80">
        4.4 (50+) Reviews
      </span>
    </div>
  );
}

export default function Hero() {
  const Copy = (
    <>
      <h1 className="font-display text-[40px] font-semibold leading-[1.04] tracking-[-0.02em] text-[#142e2a] md:text-[60px]">
        Uk First.{" "}
        <span className="font-serif italic font-normal">Wegovy Pills</span>
      </h1>
      <p className="mt-3 font-display text-[19px] font-medium leading-[1.2] text-[#142e2a] md:text-[26px]">
        A New Way To Lose Weight
      </p>
      <p className="mt-4 max-w-[500px] font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15px]">
        Introducing Wegovy® pills in the UK, with clinician-led support tailored
        to you. Same proven formula. No needles. Just real results.
      </p>

      <a
        href="/consultation"
        className="mt-7 inline-flex h-[52px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-9 font-ui text-[14px] font-semibold uppercase tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421] sm:w-auto"
      >
        Get Started Today
      </a>

      <ul className="mt-7 flex flex-col gap-3">
        {STATS.map((s) => (
          <li key={s} className="flex items-center gap-3">
            <CheckBadge />
            <span className="font-ui text-[14px] leading-[20px] text-[#142e2a]/85 md:text-[15px]">
              {s}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <section
      aria-label="Wegovy Pills — a new way to lose weight"
      className="w-full bg-[#f3f1ea]"
    >
      {/* Announcement bar */}
      <div className="w-full bg-[#142e2a]">
        <p className="mx-auto w-full max-w-[1440px] px-6 py-2 text-center font-ui text-[12px] font-medium tracking-[0.01em] text-white/90 md:px-10 lg:px-16">
          New Wegovy® Pills treatment in the UK
        </p>
      </div>

      {/* ---------- Mobile: photo on top, copy below ---------- */}
      <div className="md:hidden">
        <div className="relative aspect-[4/5] w-full">
          <Image
            src="/assets/wegovy/hero.png"
            alt="Woman smiling outdoors holding a glass of water"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="bg-white px-6 py-8">
          <Reveal as="div">
            <div className="mb-4">
              <TrustRow />
            </div>
            {Copy}
          </Reveal>
        </div>
      </div>

      {/* ---------- Desktop: photo right, copy on the light left ---------- */}
      <div className="relative hidden min-h-[640px] w-full items-center overflow-hidden md:flex">
        <Image
          src="/assets/wegovy/hero.png"
          alt="Woman smiling outdoors holding a glass of water"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "linear-gradient(90deg, rgba(243,241,234,0.96) 0%, rgba(243,241,234,0.9) 34%, rgba(243,241,234,0.45) 52%, rgba(243,241,234,0) 70%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-10 py-20 lg:px-16">
          <Reveal as="div" className="max-w-[560px]">
            <div className="mb-5">
              <TrustRow />
            </div>
            {Copy}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
