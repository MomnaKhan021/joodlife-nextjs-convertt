import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * Foundayo hero — Figma 1:1505 (desktop) and the mobile frame.
 * Full-bleed lifestyle photo, copy in white on the left. Desktop keeps the
 * photo's own shading and adds a soft dark wash on the left for legibility;
 * mobile stacks the copy over the top of the photo.
 */
function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path d="M3 8.5l3.2 3L13 4.5" stroke="#8fe0a4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const c = FOUNDAYO.hero;
  return (
    <section
      aria-label="Foundayo pills — a new way to lose weight"
      className="relative flex min-h-[640px] w-full items-start overflow-hidden bg-[#3b2a24] md:min-h-[700px] md:items-center"
    >
      <Image
        src={c.image}
        alt={c.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_center] md:object-[center_35%]"
      />
      {/* legibility wash — heavier on mobile where the copy sits over the photo */}
      <div
        aria-hidden
        className="absolute inset-0 md:hidden"
        style={{ background: "linear-gradient(180deg, rgba(40,25,20,0.55) 0%, rgba(40,25,20,0.35) 55%, rgba(40,25,20,0.7) 100%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block"
        style={{ background: "linear-gradient(90deg, rgba(35,22,18,0.62) 0%, rgba(35,22,18,0.42) 32%, rgba(35,22,18,0.08) 58%, rgba(35,22,18,0) 75%)" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-12 pt-10 md:px-10 md:py-20 lg:px-[60px]">
        <Reveal as="div" className="max-w-[520px]">
          <h1 className="text-white">
            <span className="block font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-[52px] md:text-[64px]">
              {c.title}
            </span>
            <span className="block font-serif text-[42px] font-normal italic leading-[1.05] tracking-[-0.01em] sm:text-[52px] md:text-[64px]">
              {c.titleAccent}
            </span>
          </h1>
          <p className="mt-4 font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] text-white md:mt-5 md:text-[26px]">
            {c.subtitle}
          </p>
          <p className="mt-3 max-w-[440px] font-ui text-[15px] leading-[1.45] text-white/85 md:text-[16px]">
            {c.body}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Image src="/assets/icons/trustpilot-logo-dark.svg" alt="Trustpilot" width={74} height={18} className="h-[18px] w-auto brightness-0 invert" />
            <Image src="/assets/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} className="h-4 w-auto" />
            <span className="font-ui text-[13px] text-white/90">
              <strong className="font-semibold">4.4</strong> {c.reviewsLabel.replace(/^4\.4\s*/, "")}
            </span>
          </div>

          <EligibilityCta
            product="weight-loss"
            href={c.ctaHref}
            label={c.ctaLabel}
            className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-white px-9 font-ui text-[15px] font-semibold tracking-[-0.01em] text-[#142e2a] transition-colors hover:bg-[#daffe0] md:w-[300px]"
          />

          <ul className="mt-6 flex flex-col gap-2.5">
            {c.stats.map((s) => (
              <li key={s} className="flex items-center gap-2.5">
                <Tick />
                <span className="font-ui text-[13.5px] leading-[18px] text-white/90 md:text-[14px]">{s}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
