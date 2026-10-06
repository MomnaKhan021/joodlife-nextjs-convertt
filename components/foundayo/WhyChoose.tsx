import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { FOUNDAYO } from "@/lib/foundayoContent";
import { ACCENT, BODY, H2 } from "./type";

/**
 * "Why choose Jood for weight loss" — Figma 2003:1774 (1440×665, 30px
 * corners, 80/60 padding) and 2003:1085 (mobile). Photo band with the
 * heading, three 483×80 frosted benefit rows (20px label, 18px mobile; 40px
 * tick circle) and the safety notice — the shorter wording on mobile.
 */
export default function WhyChoose() {
  const c = FOUNDAYO.whyChoose;
  return (
    <section aria-label="Why choose Jood for weight loss" className="w-full bg-white">
      <div className="relative flex min-h-[669px] w-full items-end overflow-hidden rounded-b-[20px] md:min-h-[665px] md:items-center md:rounded-[30px]">
        <Image src={c.image} alt={c.imageAlt} fill sizes="100vw" className="object-cover object-[64%_top] md:object-[center_38%]" quality={90} />
        <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(20,30,25,0) 0%, rgba(20,30,25,0.25) 30%, rgba(20,30,25,0.75) 62%, rgba(20,30,25,0.9) 100%)" }} />
        <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(90deg, rgba(20,30,25,0.6) 0%, rgba(20,30,25,0.4) 34%, rgba(20,30,25,0.05) 60%, rgba(20,30,25,0) 80%)" }} />

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-[60px]">
          <div className="w-full max-w-[483px] pb-[30px] md:py-20">
            <Reveal>
              <h2 className={`${H2} text-white`}>
                {c.heading} <span className={ACCENT}>{c.headingAccent}</span>
              </h2>
            </Reveal>
            <ul className="mt-6 flex flex-col gap-[10px] md:mt-10">
              {c.benefits.map((b, i) => (
                <Reveal
                  as="li"
                  key={b}
                  direction="right"
                  delay={120 + i * 130}
                  className="fnd-lift flex min-h-[72px] items-center justify-between gap-6 rounded-lg bg-black/[0.23] px-4 py-4 backdrop-blur-[34px] md:min-h-[80px] md:py-5"
                >
                  <span className="font-ui text-[18px] font-medium leading-[19.5px] tracking-[-0.3px] text-white md:text-[20px]">{b}</span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#a7a7a7]/[0.29]">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden><circle cx="10" cy="10" r="8" stroke="#fff" strokeWidth="1.3" /><path d="M6.5 10.2l2.3 2.2 4.7-4.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={120 + c.benefits.length * 130}>
              <p className={`${BODY} mt-6 text-white md:mt-[30px] md:hidden`}>{c.safetyMobile}</p>
              <p className={`${BODY} mt-[30px] hidden text-white md:block`}>{c.safety}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
