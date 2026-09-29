import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import CountUpPercent from "@/components/wegovy/CountUpPercent";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "Real results with Foundayo" — left: green bokeh card with the ~12.4% stat,
 * study footnote and the "any time of day" panel; right: photo with the
 * "Health gains beyond numbers" overlay.
 */
export default function RealResults() {
  const c = FOUNDAYO.realResults;
  return (
    <section aria-label="Real results with Foundayo" className="w-full bg-white">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-6 py-[30px] md:px-10 md:py-10 lg:grid-cols-2 lg:px-[60px]">
        <Reveal as="div" className="h-full">
          <div className="relative flex h-full min-h-[520px] flex-col justify-between gap-5 overflow-hidden rounded-[24px] bg-[#3b5a3a] p-4 md:min-h-[580px] md:p-5">
            <Image src={c.bokeh} alt="" fill aria-hidden sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-center" />
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(60,90,55,0.2) 0%, rgba(40,70,45,0.55) 60%, rgba(25,50,35,0.85) 100%)" }} />

            <h2 className="relative pt-2 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
              {c.heading} <span className="font-serif font-normal italic">{c.headingAccent}</span>
            </h2>

            <div className="relative rounded-2xl bg-white/[0.14] p-5 backdrop-blur-md md:p-6">
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#142e2a]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 16l5-5 4 4 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 8h5v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span className="font-ui text-[16px] text-white/90 md:text-[18px]">{c.statPrefix}</span>
              </span>
              <span className="mt-1 flex items-baseline font-display text-[64px] font-medium leading-none text-white sm:text-[80px] md:text-[112px]">
                <span className="mr-1 font-light">~</span>
                <CountUpPercent value={c.statValue} decimals={1} suffix="%" className="inline-block" />
              </span>
              <p className="mt-2 font-ui text-[16px] font-semibold text-white/90 md:text-[20px]">{c.statCaption}</p>
              <p className="mt-3 font-ui text-[11px] leading-[16px] text-white/80 md:text-[12px] md:leading-[17px]">{c.footnote}</p>
            </div>

            <div className="relative flex items-start gap-3 rounded-2xl bg-white/[0.14] px-5 py-4 backdrop-blur-md">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#142e2a]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="8.5" stroke="#fff" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div>
                <p className="font-ui text-[14px] text-white/85 md:text-[16px]">{c.anytimeTitle}</p>
                <p className="font-ui text-[18px] font-semibold leading-[1.2] text-white md:text-[24px]">{c.anytimeBody}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal as="div" delay={120} className="h-full">
          <div className="relative h-full min-h-[520px] overflow-hidden rounded-[24px] md:min-h-[580px]">
            <Image src={c.photo} alt={c.photoAlt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-[center_20%]" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[#3a2b25]/80 px-5 py-5 backdrop-blur-sm md:inset-x-5 md:bottom-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3c-4 3-7 6.5-7 10.5A7 7 0 0 0 12 21a7 7 0 0 0 7-7.5C19 9.5 16 6 12 3z" stroke="#142e2a" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 21V11" stroke="#142e2a" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </span>
              <p className="mt-3 font-ui text-[18px] font-semibold text-white md:text-[22px]">{c.overlayTitle}</p>
              <p className="mt-1.5 font-ui text-[13px] leading-[19px] text-white/85 md:text-[15px] md:leading-[21px]">{c.overlayBody}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
