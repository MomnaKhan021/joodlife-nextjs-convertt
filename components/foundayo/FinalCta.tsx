import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";
import { ACCENT, BODY, BTN_LIGHT, WRAP } from "./type";

/**
 * Closing CTA — Figma 2003:1858 (1320×430 #fff8f6 card, 24px corners: heart
 * tile, 48/52 heading, intro, portrait over a soft white disc, 241×50
 * outlined button on the right) and 2003:1136 (mobile: portrait card with a
 * frosted panel holding the copy and a full-width button; heading 32/36).
 */
function Heart() {
  return (
    <span className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-[#142e2a] md:h-[46px] md:w-[46px]">
      <svg width="20" height="19" viewBox="0 0 22 21" fill="none" aria-hidden>
        <path d="M11 19s-7.5-4.5-7.5-10.5C3.5 5.46 5.96 3 9 3c1.55 0 3.13.76 4 2.07C13.87 3.76 15.45 3 17 3c3.04 0 5.5 2.46 5.5 5.5C22.5 14.5 11 19 11 19z" fill="#fff" />
      </svg>
    </span>
  );
}

export default function FinalCta() {
  const c = FOUNDAYO.finalCta;
  const heading = (
    <h2 className="font-display text-[32px] !font-semibold leading-[36px] tracking-[-1px] text-[#142e2a] md:text-[48px] md:leading-[52px] md:tracking-[-1.2px]">
      {c.heading} <em className={`${ACCENT} md:block`}>{c.headingAccent}</em>
    </h2>
  );
  return (
    <section aria-label="Ready to stop starting over" className="w-full bg-white pb-[30px] md:pb-0">
      <div className={WRAP}>
        <Reveal as="div">
          {/* Desktop */}
          <div className="fnd-lift relative hidden h-[430px] overflow-hidden rounded-[24px] bg-[#fff8f6] md:block">
            {/* Figma: disc at x 437, portrait at x 457 of the 1320px card. */}
            <div aria-hidden className="pointer-events-none absolute left-[33.1%] top-2 h-[442px] w-[438px] rounded-full bg-white/50" />
            <div className="absolute bottom-0 left-[34.6%] h-[433px] w-[406px]">
              <Image src={c.image} alt={c.imageAlt} fill sizes="406px" quality={90} className="object-contain object-bottom" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-center gap-[22px] pl-[61px]">
              <Heart />
              {heading}
              <p className={`${BODY} max-w-[360px] text-[#142e2a]`}>{c.body}</p>
            </div>
            <div className="absolute bottom-[60px] right-[17px] z-10">
              <EligibilityCta product="weight-loss" href={c.ctaHref} label={c.ctaLabel} className={`w-[241px] ${BTN_LIGHT}`} />
            </div>
          </div>

          {/* Mobile */}
          <div className="relative h-[560px] overflow-hidden rounded-[24px] bg-[#fff8f6] md:hidden">
            <Image src={c.image} alt={c.imageAlt} fill sizes="100vw" quality={90} className="object-cover object-top" />
            <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-[14px] rounded-2xl bg-white/45 p-4 backdrop-blur-xl">
              <Heart />
              {heading}
              <p className={`${BODY} text-[#142e2a]`}>{c.body}</p>
              <EligibilityCta product="weight-loss" href={c.ctaHref} label={c.ctaLabel} className={`w-full ${BTN_LIGHT}`} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
