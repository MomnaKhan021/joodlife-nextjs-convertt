import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { FOUNDAYO } from "@/lib/foundayoContent";
import { ACCENT, BODY, H2 } from "./type";

/**
 * "Real results need real support" — Figma 2003:1671 (two 650×763 cards,
 * 20px apart) and the mobile frame (stacked, 358 wide).
 * Left: bokeh card, glass panel with "A pharmacist, / 7 Days / a week, on
 * WhatsApp." (22/28.6, 150.9/190.2, 25/25.6 desktop; 20/26, 80/100.8, 18/21.6
 * mobile), then the "One tablet a day" panel (22/28.6 + 34/44.3; 20/26 +
 * 28/36.5 mobile). Right: photo with the "Beyond the scales" overlay.
 */
function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-white md:h-[50px] md:w-[50px]">{children}</span>
  );
}

const GLASS = "relative rounded-xl bg-white/[0.06] backdrop-blur-[42px] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.08)]";

export default function RealResults() {
  const c = FOUNDAYO.realResults;
  return (
    <section aria-label="Real results need real support" className="w-full bg-white">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-4 py-[30px] md:px-10 md:py-20 lg:grid-cols-2 lg:px-[60px]">
        <Reveal as="div" className="h-full">
          <div className="fnd-lift relative flex h-full flex-col gap-4 overflow-hidden rounded-xl bg-[#4a4074] px-2 pb-2 pt-[30px] md:min-h-[763px] md:gap-8 md:px-5 md:pb-10 md:pt-10">
            <Image src={c.bokeh} alt="" fill aria-hidden sizes="(max-width:1024px) 100vw, 650px" className="object-cover object-center" />
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(60,90,55,0.15) 0%, rgba(40,70,45,0.35) 60%, rgba(25,60,55,0.65) 100%)" }} />

            <h2 className={`${H2} relative px-2 text-white md:px-0`}>
              {c.heading} <span className={ACCENT}>{c.headingAccent}</span>
            </h2>

            <div className={`${GLASS} px-3 py-4 md:px-5 md:py-[30px]`}>
              <div className="flex items-center gap-[14px] md:items-start md:gap-5">
                <IconCircle>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="3" width="18" height="18" rx="3" fill="#142e2a" /><path d="M7 9l4 4 3-3 4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </IconCircle>
                <p className="font-ui text-[20px] font-medium leading-[26px] tracking-[-0.5px] text-white md:mt-[11px] md:text-[22px] md:leading-[28.6px]">{c.lead}</p>
              </div>
              <div className="md:pl-[70px]">
                <p className="mt-1 font-display text-[80px] font-medium leading-[100.8px] tracking-[-3px] text-white md:-mt-2 md:text-[150.9px] md:leading-[190.2px]">{c.big}</p>
                <p className="font-ui text-[18px] font-medium leading-[21.6px] tracking-[-0.5px] text-white md:-mt-[6px] md:text-[25px] md:leading-[25.6px]">{c.tail}</p>
                <p className="mt-3 font-ui text-[14.3px] leading-[17.2px] tracking-[-0.3px] text-white md:mt-[27px] md:text-[16.3px] md:leading-[19.5px]">{c.body}</p>
              </div>
            </div>

            <div className={`${GLASS} px-3 py-4 md:p-5`}>
              <div className="flex items-start gap-[14px] md:gap-6">
                <IconCircle>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="9" fill="#142e2a" /><path d="M12 7.5V12l3 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </IconCircle>
                <div>
                  <p className="font-ui text-[20px] font-medium leading-[26px] tracking-[-0.5px] text-white md:text-[22px] md:leading-[28.6px]">{c.tabletTitle}</p>
                  <p className="mt-2 font-ui text-[28px] font-medium leading-[36.5px] tracking-[-0.5px] text-white md:mt-1 md:text-[34px] md:leading-[44.3px]">{c.tabletBody}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal as="div" delay={120} className="h-full">
          <div className="fnd-lift relative h-[500px] overflow-hidden rounded-xl md:h-full md:min-h-[763px]">
            <Image src={c.photo} alt={c.photoAlt} fill sizes="(max-width:1024px) 100vw, 650px" className="object-cover object-[center_20%]" />
            <div className="absolute inset-x-2 bottom-2 rounded-xl bg-[#5a3d2c]/55 px-5 py-5 backdrop-blur-[42px] md:inset-x-5 md:bottom-10 md:flex md:items-start md:gap-6 md:p-5">
              <IconCircle>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3c-4 3-7 6.5-7 10.5A7 7 0 0 0 12 21a7 7 0 0 0 7-7.5C19 9.5 16 6 12 3z" fill="#142e2a" /><path d="M12 20V10M12 14l-3-3M12 17l3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </IconCircle>
              <div className="mt-4 md:mt-0">
                <p className="font-ui text-[22px] font-medium leading-[28.6px] tracking-[-0.5px] text-white">{c.overlayTitle}</p>
                <p className={`${BODY} mt-2 text-white md:mt-1`}>{c.overlayBody}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
