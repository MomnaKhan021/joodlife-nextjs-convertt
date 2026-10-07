import Link from "next/link";

import type { LanderExpertise } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import { LP_GUTTER } from "./shared";

/** "Weight Loss, Backed By Medical Expertise." (Figma 23:2728; mobile 20:994). */
export default function LpExpertise({ content: c, style }: { content: LanderExpertise; style?: SectionStyle }) {
  return (
    <section className="bg-white pb-[40px] pt-[40px] lg:pb-[72px] lg:pt-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col gap-[24px] lg:flex-row lg:items-center lg:justify-between lg:gap-10 ${LP_GUTTER}`}>
        <div className="flex flex-col gap-[16px] lg:w-[659px] lg:shrink">
          <h2 className="max-w-[592px] font-display text-[32px] font-semibold leading-[36px] tracking-[-0.96px] text-[#17282a] lg:text-[48px] lg:leading-[51.84px]">
            {c.heading}
            {c.headingAccent ? (
              <>
                {" "}
                <em className="font-serif font-normal italic">{c.headingAccent}</em>
              </>
            ) : null}
          </h2>
          {c.body ? <p className="max-w-[560px] font-ui text-[16px] leading-[24px] text-[#17282a]">{c.body}</p> : null}
        </div>

        <div className="flex flex-col items-start gap-[24px] rounded-[16px] bg-[#f6f9f2] p-[20px] lg:flex-1 lg:flex-row lg:items-center lg:gap-[28px] lg:px-[32px] lg:py-[28px]">
          {/* Medical cross — two white bars in a 64px green circle */}
          <span aria-hidden className="relative size-[64px] shrink-0 rounded-full bg-[#132d2a]">
            <span className="absolute left-[28px] top-[19px] h-[26px] w-[8px] bg-white" />
            <span className="absolute left-[19px] top-[28px] h-[8px] w-[26px] bg-white" />
          </span>
          <div className="flex max-w-[436px] flex-col">
            <h3 className="font-ui text-[20px] font-medium leading-[20.6px] tracking-[-0.488px] text-[#142e2a]">{c.leadName}</h3>
            <p className="pb-[8px] pt-[4px] font-ui text-[16.3px] leading-[19.5px] tracking-[-0.32px] text-[#142e2a]">{c.leadRole}</p>
            {c.linkLabel.trim() ? (
              <Link href={c.linkHref} className="w-fit font-ui text-[16px] font-medium leading-[21px] text-[#13332b] underline">
                {c.linkLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
