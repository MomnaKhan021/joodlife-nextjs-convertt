import Image from "next/image";

import type { LanderResults } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import LpSlider from "./LpSlider";
import { LP_GUTTER, LpCta, LpVerified, rawImage } from "./shared";

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
 * mobile 20:1058). Two cards fit on desktop and one on phones; the dots only
 * show when there are more cards than fit.
 */
export default function LpResults({ content: c, style }: { content: LanderResults; style?: SectionStyle }) {
  return (
    <section className="bg-[#f7f9f2] py-[40px] lg:py-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col items-center gap-[24px] lg:gap-[40px] ${LP_GUTTER}`}>
        <h2 className="text-center font-display text-[32px] font-semibold leading-[36px] tracking-[-1.6px] text-[#142e2a] lg:text-[40px] lg:leading-[52px]">
          {c.heading}
          {c.headingAccent ? (
            <>
              <br className="lg:hidden" />{" "}
              <em className="font-serif text-[32px] font-normal italic leading-[36px] tracking-[-1.2px] lg:text-[48px] lg:leading-[52px]">
                {c.headingAccent}
              </em>
            </>
          ) : null}
        </h2>

        <div className="flex w-full max-w-[1108px] flex-col items-center gap-[24px] lg:gap-[32px]">
          <LpSlider gap={20} itemClassName="w-full lg:w-[calc(50%-10px)]">
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
                        {r.lost}
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

          <LpCta label={c.ctaLabel} href={c.ctaHref} />
        </div>
      </div>
    </section>
  );
}
