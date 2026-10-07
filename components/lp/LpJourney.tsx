import type { LanderJourney } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import LpSlider from "./LpSlider";
import LpVideo from "./LpVideo";
import { LP_GUTTER, LpCta, LpHeading, LpStepLabel } from "./shared";

/**
 * "Your Journey" video cards (Figma 23:2641; mobile 23:2795). Four fit on
 * desktop; more turn the row into a slider with dots.
 */
export default function LpJourney({ content: c, style }: { content: LanderJourney; style?: SectionStyle }) {
  const total = c.items.length;
  return (
    <section className="bg-[#f6f9f2] py-[40px] lg:py-[96px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col items-center ${LP_GUTTER}`}>
        <LpHeading
          lead={c.heading}
          accent={c.headingAccent}
          className="text-center !font-medium !tracking-[-0.96px] !text-[#17282a] lg:!leading-[51.84px]"
        />
        {c.subtitle ? (
          <p className="max-w-[340px] pt-[12px] text-center font-ui text-[16.3px] leading-[19.5px] tracking-[-0.32px] text-[#142e2a] lg:max-w-none">
            {c.subtitle}
          </p>
        ) : null}

        <LpSlider bleed className="py-[24px] lg:py-[48px]" itemClassName="w-[300px] lg:w-[calc((100%-48px)/4)]">
          {c.items.map((s, i) => (
            <article key={`${s.title}-${i}`} className="flex w-full flex-col rounded-[18px] bg-white px-[10px] pb-[24px] pt-[10px]">
              <LpVideo
                image={s.image}
                video={s.video}
                alt={s.alt || s.title}
                sizes="(max-width: 1024px) 280px, 290px"
                className="h-[333.75px] w-full rounded-[12px]"
              >
                {s.badge ? (
                  <span className="absolute left-[12px] top-[12px] rounded-[99px] bg-[#132d2a] px-[12px] py-[4px] font-ui text-[13px] font-medium leading-[19.5px] text-white">
                    {s.badge}
                  </span>
                ) : null}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-b from-[rgba(10,25,22,0)] to-[rgba(10,25,22,0.6)] p-[16px] font-ui text-[16px] leading-[17px] tracking-[-0.427px] text-white">
                  Video {i + 1} of {total}
                </span>
              </LpVideo>
              <div className="flex flex-col px-[10px]">
                <span className="pt-[22px]">
                  <LpStepLabel>Step {i + 1}</LpStepLabel>
                </span>
                <h3 className="pt-[6px] font-ui text-[22px] font-medium leading-[25.6px] tracking-[-0.5px] text-[#142e2a] xl:text-[24px]">
                  {s.title}
                </h3>
                <p className="max-w-[247px] pt-[8px] font-ui text-[16px] leading-[17px] tracking-[-0.427px] text-[#142e2a]">{s.body}</p>
              </div>
            </article>
          ))}
        </LpSlider>

        {/* The phone frame has no button here */}
        <div className="hidden lg:block">
          <LpCta label={c.ctaLabel} href={c.ctaHref} />
        </div>
      </div>
    </section>
  );
}
