import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { WLT } from "@/lib/weightLossTabletContent";
import { ACCENT, BODY, BTN_TEXT, H2, WRAP } from "./type";

/**
 * "Simple dosing & pricing" — Figma 2003:1720 and the mobile frame.
 * Copy column 616px wide: heading, intro, four 145×157 step cards (#fff8f6,
 * 12px corners), the 616×98 commit-and-save bar; the hand-and-tablet image
 * (561×513) sits on the right on desktop. Mobile: four narrow cards in a
 * row with the "Start Here" tag, and the CTA full width inside the bar.
 */
export default function Dosing() {
  const c = WLT.dosing;
  return (
    <section aria-label="Simple dosing and pricing" className="w-full bg-white py-[30px] md:py-20">
      <div className={WRAP}>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[616px_minmax(0,1fr)]">
          <div>
            <Reveal as="div">
              <h2 className={`${H2} text-[#142e2a]`}>
                <span className={ACCENT}>{c.heading}</span>
                <br className="md:hidden" /> {c.headingAccent}
              </h2>
              <p className={`${BODY} mt-[14px] max-w-[600px] text-[#142e2a] md:mt-6`}>{c.body}</p>
            </Reveal>

            <div className="mt-[22px] grid grid-cols-4 gap-[7px] md:mt-[41px] md:gap-3">
              {c.steps.map((d, i) => (
                <Reveal
                  as="div"
                  key={d.step}
                  delay={i * 110}
                  className="fnd-lift flex min-h-[115px] flex-col items-center rounded-xl bg-[#fff8f6] px-1 pb-[10px] pt-[10px] text-center text-black md:min-h-[157px] md:px-3 md:pb-[17px] md:pt-[17px]"
                >
                  {d.start ? (
                    <>
                      <span className="mb-1 rounded-full bg-[#142e2a] px-3 py-[3px] font-ui text-[8px] leading-[9.6px] text-white md:hidden">{c.startBadgeMobile}</span>
                      <span className="mb-2 hidden rounded-full bg-[#142e2a] px-[10px] py-[3px] font-ui text-[12px] leading-[14.4px] text-white md:inline-block">{c.startBadge}</span>
                    </>
                  ) : (
                    <span aria-hidden className="block h-[3px] md:h-0" />
                  )}
                  <span className="font-ui text-[14px] font-bold leading-[16.8px] tracking-[-0.3px] md:text-[24px] md:font-medium md:leading-[19.5px]">{d.step}</span>
                  <span className="mt-1 font-ui text-[10px] leading-[12px] tracking-[-0.3px] md:mt-[10px] md:text-[12px] md:leading-[14.4px]">{d.label}</span>
                  <span className="mt-[6px] font-display text-[10px] font-medium leading-[12px] tracking-[-0.3px] md:mt-[10px]">{d.days}</span>
                  <span className="mt-auto pt-2 font-ui text-[14px] font-bold leading-[16.8px] tracking-[-0.3px] md:pt-[10px]">
                    {d.price}<span className="font-normal">/mo</span>
                  </span>
                </Reveal>
              ))}
            </div>

            <Reveal as="div" delay={160} className="mt-3">
              <div
                className="fnd-lift flex flex-col gap-3 rounded-xl px-4 py-4 text-white md:min-h-[98px] md:flex-row md:items-center md:justify-between md:py-6"
                style={{ background: "linear-gradient(110deg, #13302b 0%, #1d4038 55%, #3f6f66 100%)" }}
              >
                <div className="flex items-start gap-3 md:items-center">
                  <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 12V4h8l10 10-8 8L3 12z" fill="#142e2a" /><circle cx="7.5" cy="8.5" r="1.6" fill="#fff" /></svg>
                  </span>
                  <div>
                    <p className="font-ui text-[16px] font-medium leading-[19.5px] tracking-[-0.3px]">{c.commitTitle}</p>
                    <p className="mt-1 font-ui text-[12px] leading-[14.4px] tracking-[-0.3px] text-white/90">{c.commitBody}</p>
                  </div>
                </div>
                <EligibilityCta
                  product="weight-loss"
                  href={c.commitHref}
                  label={c.commitCta}
                  className={`${BTN_TEXT} ml-[50px] inline-flex h-8 items-center justify-center rounded-lg border border-[#d3dabe] bg-white !text-[12px] text-[#142e2a] transition-colors hover:bg-[#daffe0] md:ml-0 md:h-[50px] md:w-[192px] md:shrink-0 md:!text-[16.3px]`}
                />
              </div>
            </Reveal>
          </div>

          <Reveal as="div" delay={100} className="hidden lg:block">
            <div className="relative ml-auto aspect-[561/513] w-full max-w-[561px]">
              <Image src={c.image} alt={c.imageAlt} fill sizes="561px" className="object-contain object-right" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
