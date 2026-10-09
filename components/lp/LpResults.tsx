import Image from "next/image";

import Reveal from "@/components/ui/Reveal";
import CountUpPercent from "@/components/wegovy/CountUpPercent";
import type { LanderResults } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import LpSlider from "./LpSlider";
import { LP_GUTTER, LpCta, LpVerified, rawImage } from "./shared";

/**
 * "−17kg" → counts 0 → 17 when it scrolls into view, keeping the sign and
 * unit around it. Text without a number (CMS) is shown as it is.
 */
function Lost({ text }: { text: string }) {
  const m = text.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return <>{text}</>;
  const [, prefix, num, suffix] = m;
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  return <CountUpPercent value={Number(num)} decimals={decimals} prefix={prefix} suffix={suffix} />;
}

function Photo({ src, label, after, alt }: { src: string; label: string; after?: boolean; alt: string }) {
  return (
    <div className="relative aspect-[252/315] flex-1 overflow-hidden rounded-[12px] bg-[#e7ecd7]">
      {src ? (
        <Image src={src} alt={alt} fill unoptimized={rawImage(src)} sizes="(max-width: 1024px) 45vw, 252px" className="object-cover" />
      ) : null}
      {label ? (
        <span
          className={`absolute left-[10px] top-[10px] rounded-full px-[14px] py-[4px] font-ui text-[12px] font-medium leading-[17.8px] ${
            after ? "bg-[#b4ff9f] text-[#13332b]" : "bg-[rgba(16,37,31,0.8)] text-white"
          }`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * "Real patients, real journeys." before/after cards (Figma 20:527;
 * mobile 20:1058). The next card always peeks in — from the screen's right
 * edge on desktop — so it reads as a slider; dots show when cards overflow.
 */
export default function LpResults({ content: c, style }: { content: LanderResults; style?: SectionStyle }) {
  return (
    <section className="overflow-x-clip bg-[#f7f9f2] py-[60px] lg:py-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-[30px] lg:gap-[40px] ${LP_GUTTER}`}>
        <Reveal>
        <h2 className="text-center font-display text-[36px] !font-semibold leading-[43.2px] tracking-[-1.2px] text-[#142e2a] md:text-[48px] md:leading-[52px]">
          {c.heading}
          {c.headingAccent ? (
            <>
              <br className="lg:hidden" />{" "}
              <em className="font-serif font-normal italic">
                {c.headingAccent}
              </em>
            </>
          ) : null}
        </h2>
        </Reveal>

        {/* Full content width, so the first card lines up with the other sections. */}
        <div className="flex w-full flex-col items-center gap-[24px] lg:gap-[32px]">
          <Reveal delay={120} className="w-full">
          {/* Phones: one card with the next peeking in. Desktop: the row runs to
              the screen's right edge — 1½ cards on small laptops, 2½ from 1280px. */}
          <LpSlider
            gap={20}
            bleed
            bleedRight
            itemClassName="w-[85%] lg:w-[min(544px,calc((100%-20px)/1.5))] xl:w-[min(560px,calc((100%-40px)/2.5))]"
          >
            {c.items.map((r, i) => (
              <article key={`${r.name}-${i}`} className="flex w-full flex-col gap-[16px] rounded-[22px] bg-white p-[12px] lg:gap-[20px] lg:p-[14px]">
                <div className="flex gap-[6px]">
                  <Photo src={r.before} label={r.beforeLabel} alt={`${r.name} before treatment`} />
                  <Photo src={r.after} label={r.afterLabel} after alt={`${r.name} after treatment`} />
                </div>

                <div className="flex flex-col gap-[12px] lg:flex-row lg:items-start lg:gap-[20px]">
                  {r.lost || r.detail ? (
                    // Stat box — 160×132 on desktop, a single row on phones
                    <div className="flex items-center gap-[12px] rounded-[12px] bg-[#f7f9f2] px-[16px] py-[8px] lg:h-[132px] lg:w-[160px] lg:shrink-0 lg:flex-col lg:justify-center lg:gap-[8px] lg:py-[22px]">
                      <p className="whitespace-nowrap font-serif text-[36px] leading-[44px] tracking-[-2px] text-[#13332b] lg:text-[54px] lg:leading-[60.8px] lg:tracking-[-3.28px]">
                        <Lost text={r.lost} />
                      </p>
                      <p className="font-ui text-[13.5px] leading-[18.2px] text-[#142e2a]/80 lg:text-center">{r.detail}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col gap-[16px]">
                    <div className="flex flex-col gap-[6px] font-ui font-medium">
                      <p className="text-[14px] leading-[22.5px] text-[#10251f]">{r.name}</p>
                      <p className="text-[15px] leading-[19.5px] tracking-[-0.32px] text-[#142e2a] lg:text-[16.3px] lg:leading-[20.5px]">{r.quote}</p>
                    </div>
                    <LpVerified />
                  </div>
                </div>
              </article>
            ))}
          </LpSlider>
          </Reveal>

          <Reveal delay={200}>
            <LpCta label={c.ctaLabel} href={c.ctaHref} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
