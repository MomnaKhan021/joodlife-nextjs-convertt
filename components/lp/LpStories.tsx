import Image from "next/image";

import Reveal from "@/components/ui/Reveal";
import type { LanderStories } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import LpSlider from "./LpSlider";
import LpVideo from "./LpVideo";
import { LP_BODY, LP_GUTTER, LpHeading, rawImage } from "./shared";

/** "Real Stories From People Like You" (Figma 20:413; mobile 20:943). */
export default function LpStories({ content: c, style }: { content: LanderStories; style?: SectionStyle }) {
  return (
    <section className="bg-white py-[60px] lg:py-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-[30px] lg:gap-[48px] ${LP_GUTTER}`}>
        <Reveal className="flex flex-col items-center gap-[12px] text-center">
          <LpHeading lead={c.heading} accent={c.headingAccent} />
          {c.subtitle ? <p className={`${LP_BODY} text-[#142e2a]`}>{c.subtitle}</p> : null}
        </Reveal>

        {/* Three 416×550 cards fit on desktop; more become a slider. The row
            fades in as one — a peeking card is too small to trigger its own. */}
        <Reveal delay={120} className="w-full">
          <LpSlider bleed itemClassName="w-[260px] lg:w-[calc((100%-32px)/3)]">
            {c.items.map((s, i) => (
              <LpVideo
                key={`${s.image}-${s.video}-${i}`}
                image={s.image}
                video={s.video}
                alt={s.alt}
                sizes="(max-width: 1024px) 300px, 416px"
                className="h-[380px] w-full rounded-[20px] lg:h-[460px]"
              />
            ))}
          </LpSlider>
        </Reveal>

        {/* Feature cards — 4 across, 2×2 on phones */}
        {c.features.length ? (
          <div className="grid w-full grid-cols-2 gap-[8px] lg:grid-cols-4 lg:gap-[16px]">
            {c.features.map((f, i) => (
              <Reveal
                key={`${f.title}-${i}`}
                delay={i * 110}
                className="fnd-lift flex flex-col gap-[16px] rounded-[16px] bg-[#f7f9f2] p-[16px] lg:gap-[20px] lg:p-[24px]"
              >
                {f.icon ? (
                  <Image src={f.icon} alt="" width={24} height={24} unoptimized={rawImage(f.icon)} className="size-[24px] self-start object-contain" />
                ) : null}
                <div className="flex flex-col gap-[8px] text-[#142e2a]">
                  <h3 className="font-ui text-[17px] !font-medium leading-[20px] tracking-[-0.3px] lg:text-[18px]">{f.title}</h3>
                  <p className="font-ui text-[14px] leading-[19px] tracking-[-0.3px] text-[#142e2a]/85 lg:text-[16px] lg:leading-[21px]">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
