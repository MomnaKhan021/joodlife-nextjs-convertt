import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { FOUNDAYO } from "@/lib/foundayoContent";

/**
 * "Why choose jood life for foundayo" — full-bleed photo band (edge to edge)
 * with the heading, three benefit pills and the safety notice sitting in the
 * 1440px content column on the left.
 */
export default function WhyChoose() {
  const c = FOUNDAYO.whyChoose;
  return (
    <section aria-label="Why choose Jood Life for Foundayo" className="w-full bg-white py-[30px] md:py-10">
      <div className="relative flex min-h-[580px] w-full items-end overflow-hidden md:min-h-[520px] md:items-center">
        <Image src={c.image} alt={c.imageAlt} fill sizes="100vw" className="object-cover object-[70%_center] md:object-[center_38%]" />
        <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(20,30,25,0.1) 0%, rgba(20,30,25,0.55) 40%, rgba(20,30,25,0.9) 100%)" }} />
        <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, rgba(20,30,25,0.72) 0%, rgba(20,30,25,0.5) 34%, rgba(20,30,25,0.1) 60%, rgba(20,30,25,0) 80%)" }} />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
          <div className="w-full max-w-[440px] py-8 md:py-10">
            <Reveal>
              <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[40px] md:leading-[44px]">
                {c.heading} <span className="font-serif font-normal italic">{c.headingAccent}</span>
              </h2>
            </Reveal>
            <ul className="mt-6 flex flex-col gap-2.5">
              {c.benefits.map((b, i) => (
                <Reveal as="li" key={b} direction="right" delay={120 + i * 130} className="fnd-lift flex items-center justify-between gap-3 rounded-lg bg-black/25 px-4 py-3 backdrop-blur-sm">
                  <span className="font-ui text-[14px] font-medium text-white md:text-[15px]">{b}</span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/50">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={120 + c.benefits.length * 130}>
              <p className="mt-6 font-ui text-[12px] leading-[17px] text-white/90 md:text-[12.5px] md:leading-[18px]">{c.safety}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
