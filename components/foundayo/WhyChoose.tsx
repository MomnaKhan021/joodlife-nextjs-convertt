import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "Why choose jood life for foundayo" — rounded full-width photo with the
 * heading, three benefit pills and the safety notice over its left side.
 */
export default function WhyChoose() {
  const c = FOUNDAYO.whyChoose;
  return (
    <section aria-label="Why choose Jood Life for Foundayo" className="w-full bg-white py-[30px] md:py-10">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="relative flex min-h-[560px] items-end overflow-hidden rounded-[24px] md:min-h-[455px] md:items-center">
          <Image src={c.image} alt={c.imageAlt} fill sizes="(max-width:1440px) 100vw, 1320px" className="object-cover object-[70%_center] md:object-[center_40%]" />
          <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(20,30,25,0.1) 0%, rgba(20,30,25,0.55) 40%, rgba(20,30,25,0.9) 100%)" }} />
          <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, rgba(20,30,25,0.7) 0%, rgba(20,30,25,0.5) 35%, rgba(20,30,25,0.1) 60%, rgba(20,30,25,0) 80%)" }} />

          <Reveal as="div" className="relative z-10 w-full max-w-[400px] px-5 py-7 md:px-10 md:py-10">
            <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[40px] md:leading-[44px]">
              {c.heading} <span className="font-serif font-normal italic">{c.headingAccent}</span>
            </h2>
            <ul className="mt-6 flex flex-col gap-2.5">
              {c.benefits.map((b) => (
                <li key={b} className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-4 py-3 backdrop-blur-sm">
                  <span className="font-ui text-[14px] font-medium text-white md:text-[15px]">{b}</span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/50">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-ui text-[12px] leading-[17px] text-white/90 md:text-[12.5px] md:leading-[18px]">{c.safety}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
