import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { WLT } from "@/lib/weightLossTabletContent";
import { BODY, BTN_LIGHT } from "./type";

/**
 * Hero — Figma 2003:1228 (desktop, 749px under the header) and 2003:564
 * (mobile, 607px). Full-bleed photo, copy in white on the left:
 * 50/55 headline (32/35.2 mobile), 18.3/23.8 intro (16/20.8 mobile),
 * Trustpilot row, 372×50 white CTA (full width on mobile), reassurance
 * line and three ticked bullets.
 */
function Tick() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
      <path d="M3 9.5l3.8 3.6L15 5" stroke="#8fe0a4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const c = WLT.hero;
  return (
    <section
      aria-label="Weight loss tablet — tried every diet?"
      className="relative flex min-h-[607px] w-full items-end overflow-hidden bg-[#3b2a24] md:min-h-[749px] md:items-center"
    >
      <div className="fnd-kenburns absolute inset-0">
        <Image
          src={c.image}
          alt={c.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] md:object-[center_35%]"
        />
      </div>
      {/* legibility wash — heavier on mobile, where the copy sits over the photo */}
      <div
        aria-hidden
        className="absolute inset-0 md:hidden"
        style={{ background: "linear-gradient(180deg, rgba(40,25,20,0.15) 0%, rgba(40,25,20,0.45) 35%, rgba(40,25,20,0.7) 100%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block"
        style={{ background: "linear-gradient(90deg, rgba(35,22,18,0.55) 0%, rgba(35,22,18,0.35) 32%, rgba(35,22,18,0.05) 58%, rgba(35,22,18,0) 75%)" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-[22px] pt-10 md:px-10 md:py-[110px] lg:px-[60px]">
        <div className="max-w-[372px] md:max-w-[540px]">
          <Reveal delay={60}>
            <h1 className="text-white">
              <span className="block font-display text-[32px] font-semibold leading-[35.2px] tracking-[-1.6px] md:text-[50px] md:leading-[55px]">
                {c.title}
              </span>
              <em className="block font-serif text-[32px] font-normal italic leading-[35.2px] tracking-[-1.6px] md:text-[50px] md:leading-[55px]">
                {c.titleAccent}
              </em>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-3 font-ui text-[16px] leading-[20.8px] tracking-[-0.3px] text-white md:mt-[14px] md:text-[18.3px] md:leading-[23.8px]">
              {c.body}
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-[10px] flex flex-wrap items-center gap-2 md:mt-8">
              <Image src="/assets/icons/trustpilot-logo-dark.svg" alt="Trustpilot" width={74} height={18} className="h-[18px] w-auto brightness-0 invert" />
              <Image src="/assets/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} className="h-4 w-auto" />
              <span className="font-ui text-[14.2px] leading-[17px] tracking-[-0.4px] text-white">
                <strong className="font-bold">4.4</strong> {c.reviewsLabel}
              </span>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <EligibilityCta
              product="weight-loss"
              href={c.ctaHref}
              label={c.ctaLabel}
              className={`fnd-lift mt-[14px] w-full md:mt-[30px] md:w-[372px] ${BTN_LIGHT}`}
            />
          </Reveal>

          <Reveal delay={480}>
            <p className="mt-3 font-ui text-[15.3px] leading-[19.5px] tracking-[-0.3px] text-white/80 md:mt-[22px]">{c.reassurance}</p>
          </Reveal>

          <ul className="mt-[13px] flex flex-col gap-[13px] md:mt-[18px] md:gap-5">
            {c.bullets.map((b, i) => (
              <Reveal as="li" key={b} delay={560 + i * 110} className="flex items-center gap-[10px]">
                <Tick />
                <span className={`${BODY} text-white`}>{b}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
