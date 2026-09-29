import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * Closing CTA — light-pink card: heart icon, "Ready to start the Foundayo
 * journey?", one line of reassurance, the portrait in the middle and an
 * outlined button on the right. Mobile: portrait on top, copy card below.
 */
export default function FinalCta() {
  const c = FOUNDAYO.finalCta;
  return (
    <section aria-label="Ready to start the Foundayo journey" className="w-full bg-white pb-10 md:pb-16">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div">
          <div className="relative overflow-hidden rounded-[24px] bg-[#fbf3ef] md:h-[300px]">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 md:block" />
            <div className="relative grid h-full grid-cols-1 md:grid-cols-[400px_minmax(0,1fr)_auto] md:items-center md:gap-8 md:px-[50px]">
              <div className="relative order-2 z-10 flex flex-col items-start gap-4 px-6 pb-6 pt-5 md:order-1 md:px-0 md:py-0">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#142e2a]">
                  <svg width="20" height="19" viewBox="0 0 22 21" fill="none" aria-hidden><path d="M11 19s-7.5-4.5-7.5-10.5C3.5 5.46 5.96 3 9 3c1.55 0 3.13.76 4 2.07C13.87 3.76 15.45 3 17 3c3.04 0 5.5 2.46 5.5 5.5C22.5 14.5 11 19 11 19z" fill="#fff" /></svg>
                </span>
                <h2 className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[36px]">
                  {c.heading} <em className="font-serif font-normal italic">{c.headingAccent}</em>
                </h2>
                <p className="max-w-[360px] font-ui text-[13.5px] leading-[19px] text-[#142e2a]/75 md:text-[14px]">{c.body}</p>
                <EligibilityCta
                  product="weight-loss"
                  href={c.ctaHref}
                  label={c.ctaLabel}
                  className="inline-flex h-[48px] w-full items-center justify-center rounded-lg border border-[#0c2421] bg-white font-ui text-[14px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white md:hidden"
                />
              </div>
              <div className="relative order-1 h-[280px] w-full md:order-2 md:h-[300px]">
                <Image src={c.image} alt={c.imageAlt} fill sizes="(max-width:768px) 100vw, 400px" quality={90} className="object-contain object-bottom md:object-[60%_bottom]" />
              </div>
              <div className="relative z-10 order-3 hidden md:flex md:items-center">
                <EligibilityCta
                  product="weight-loss"
                  href={c.ctaHref}
                  label={c.ctaLabel}
                  className="inline-flex h-[48px] items-center justify-center rounded-lg border border-[#0c2421] bg-white px-10 font-ui text-[14px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
