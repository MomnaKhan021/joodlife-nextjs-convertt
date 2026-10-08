import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import type { LanderExpertise } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import { LP_BODY, LP_GUTTER, LpHeading } from "./shared";

/** "Weight Loss, Backed By Medical Expertise." (Figma 23:2728; mobile 20:994). */
export default function LpExpertise({ content: c, style }: { content: LanderExpertise; style?: SectionStyle }) {
  return (
    <section className="bg-white py-[60px] lg:pb-[72px] lg:pt-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col gap-[24px] lg:flex-row lg:items-center lg:justify-between lg:gap-10 ${LP_GUTTER}`}>
        <Reveal direction="right" className="flex flex-col gap-[16px] lg:w-[659px] lg:shrink">
          <LpHeading lead={c.heading} accent={c.headingAccent} className="max-w-[592px]" />
          {c.body ? <p className={`${LP_BODY} max-w-[560px] text-[#142e2a]`}>{c.body}</p> : null}
        </Reveal>

        <Reveal
          direction="left"
          delay={150}
          className="fnd-lift flex flex-col items-start gap-[24px] rounded-[16px] bg-[#f6f9f2] p-[20px] lg:flex-1 lg:flex-row lg:items-center lg:gap-[28px] lg:px-[32px] lg:py-[28px]"
        >
          {/* Medical cross — two white bars in a 64px green circle */}
          <span aria-hidden className="relative size-[64px] shrink-0 rounded-full bg-[#132d2a]">
            <span className="absolute left-[28px] top-[19px] h-[26px] w-[8px] bg-white" />
            <span className="absolute left-[19px] top-[28px] h-[8px] w-[26px] bg-white" />
          </span>
          <div className="flex max-w-[436px] flex-col">
            <h3 className="font-ui text-[20px] !font-medium leading-[22px] tracking-[-0.4px] text-[#142e2a]">{c.leadName}</h3>
            <p className={`${LP_BODY} pb-[8px] pt-[4px] text-[#142e2a]`}>{c.leadRole}</p>
            {c.linkLabel.trim() ? (
              <Link href={c.linkHref} className="w-fit font-ui text-[16px] font-medium leading-[21px] text-[#13332b] underline underline-offset-2">
                {c.linkLabel}
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
