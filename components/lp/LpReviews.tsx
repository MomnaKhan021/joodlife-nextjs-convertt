import Image from "next/image";

import type { LanderReviews } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import LpSlider from "./LpSlider";
import { LP_ASSETS, LP_GUTTER, LpCta, LpHeading, LpTrustpilotStars, LpVerified, TrustpilotLink } from "./shared";

/**
 * "Verified Patient Reviews" (Figma 20:537; mobile 20:1105). Three fit on
 * desktop; more (or any on phones past the first) slide, with dots.
 */
export default function LpReviews({ content: c, style }: { content: LanderReviews; style?: SectionStyle }) {
  return (
    <section className="bg-white pb-[20px] pt-[40px] lg:pt-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-[24px] lg:gap-[40px] ${LP_GUTTER}`}>
        <div className="flex flex-col items-center gap-[12px]">
          <TrustpilotLink className="flex items-center gap-[12px]">
            <span className="flex items-center gap-[8px]">
              <Image src={`${LP_ASSETS}/tp-logo.svg`} alt="Trustpilot" width={82} height={20} unoptimized />
              <LpTrustpilotStars />
            </span>
            <span className="font-ui text-[14.2px] leading-[17px] tracking-[-0.427px] text-[#142e2a]">
              <strong className="font-bold">{c.rating}</strong> out of 5
            </span>
          </TrustpilotLink>
          <LpHeading lead={c.heading} accent={c.headingAccent} className="text-center" />
        </div>

        <LpSlider bleed itemClassName="w-[85%] lg:w-[calc((100%-32px)/3)]">
          {c.items.map((r, i) => (
            <article
              key={`${r.name}-${i}`}
              className="flex w-full flex-col items-center justify-between gap-[24px] rounded-[18px] bg-[#f7f9f2] px-[24px] py-[32px] text-center lg:px-[50px]"
            >
              <div className="flex flex-col items-center gap-[24px]">
                <TrustpilotLink>
                  <LpTrustpilotStars tile={18} />
                </TrustpilotLink>
                <div className="flex flex-col items-center gap-[16px]">
                  {r.tag ? (
                    <span className="rounded-full bg-[#b4ff9f] px-[12px] py-[6px] font-ui text-[14px] font-medium text-[#13332b]">{r.tag}</span>
                  ) : null}
                  <div className="flex flex-col items-center gap-[10px]">
                    <h3 className="font-ui text-[20px] font-medium leading-[19.44px] tracking-[-0.36px] text-[#10251f]">{r.title}</h3>
                    <p className="font-ui text-[16px] leading-[19px] tracking-[-0.427px] text-[#142e2a]">{r.quote}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-[4px] pt-[18px]">
                <p className="font-ui text-[16px] font-medium leading-[20px] text-[#10251f]">{r.name}</p>
                <LpVerified size={13} />
              </div>
            </article>
          ))}
        </LpSlider>

        <LpCta label={c.ctaLabel} href={c.ctaHref} />
      </div>
    </section>
  );
}
