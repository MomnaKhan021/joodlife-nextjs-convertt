import Image from "next/image";

import type { LanderFinal } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import { LpCta, rawImage } from "./shared";

/**
 * Closing CTA — "Ready To Find Out If The Programme Is Open To You?"
 * (Figma 20:787; mobile 20:1353). Desktop: copy left, photo centre,
 * benefit cards right. Phones: copy, cards, button, then the photo.
 */
export default function LpFinal({ content: c, style }: { content: LanderFinal; style?: SectionStyle }) {
  return (
    <section className="mx-auto w-full max-w-[1440px] pb-[10px]">
      <div
        className="relative flex flex-col overflow-hidden rounded-[20px] bg-[#f7f9f2] shadow-[0px_10px_16px_0px_rgba(20,46,42,0.14)] lg:h-[630px] lg:flex-row lg:items-center lg:justify-between lg:px-[60px] lg:py-[80px]"
        {...styleProps(style)}
      >
        {/* Photo — 679×845 from x=403 at the 1440 width, cropped by the card */}
        {c.image ? (
          <div className="absolute left-[28%] top-[57px] hidden aspect-[679/845] w-[47.15%] lg:block">
            <Image src={c.image} alt={c.imageAlt} fill unoptimized={rawImage(c.image)} sizes="680px" className="object-cover" />
          </div>
        ) : null}

        <div className="relative z-10 flex flex-col gap-[24px] px-4 pt-[40px] lg:w-[419px] lg:shrink-0 lg:gap-[50px] lg:px-0 lg:pt-0">
          <div className="flex flex-col gap-[12px]">
            <h2 className="font-display text-[28px] !font-semibold leading-[32px] tracking-[-1.2px] text-[#142e2a] lg:text-[48px] lg:leading-[52px]">
              <span className="lg:capitalize">{c.heading}</span>
              {c.headingAccent ? (
                <>
                  {" "}
                  <em className="font-serif font-normal italic lg:capitalize">{c.headingAccent}</em>
                </>
              ) : null}
            </h2>
            {c.subtitle ? (
              <p className="font-ui text-[16.3px] leading-[19.5px] tracking-[-0.32px] text-[#142e2a]">{c.subtitle}</p>
            ) : null}
          </div>
          <div className="hidden flex-col gap-[12px] lg:flex">
            <LpCta label={c.ctaLabel} href={c.ctaHref} />
            {c.disclaimer ? (
              <p className="font-ui text-[14.3px] leading-[19.5px] tracking-[-0.32px] text-[#142e2a]/80">{c.disclaimer}</p>
            ) : null}
          </div>
        </div>

        <ul className="relative z-10 flex flex-col gap-[8px] px-4 pt-[24px] lg:px-0 lg:pt-0">
          {c.benefits.map((b, i) => (
            <li
              key={`${b.title}-${i}`}
              className="relative flex flex-col gap-[6px] rounded-[12px] border-[0.8px] border-white/20 bg-white px-[12px] py-[12px] backdrop-blur-[20.5px] lg:w-[377px] lg:gap-[8px] lg:px-[20px] lg:py-[24px]"
            >
              <span className="pr-[28px] font-ui text-[16px] font-medium leading-[19.5px] tracking-[-0.32px] text-[#142e2a] lg:text-[20px]">{b.title}</span>
              <span className="pr-[28px] font-ui text-[12px] leading-[16px] tracking-[-0.32px] text-[#142e2a]/80 lg:text-[14px]">{b.body}</span>
              {b.icon ? (
                <Image
                  src={b.icon}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized={rawImage(b.icon)}
                  className="absolute right-[12px] top-[12px] size-[20px] object-contain lg:right-[17.6px]"
                />
              ) : null}
            </li>
          ))}
        </ul>

        {/* Phones: button + small print, then the photo */}
        <div className="relative z-10 flex flex-col gap-[12px] px-4 pt-[16px] lg:hidden">
          <LpCta label={c.mobileCtaLabel || c.ctaLabel} href={c.ctaHref} />
          {c.disclaimer ? (
            <p className="font-ui text-[12px] leading-[16px] tracking-[-0.32px] text-[#142e2a]/80">{c.disclaimer}</p>
          ) : null}
        </div>
        {c.image ? (
          <div className="relative mt-[16px] aspect-[390/260] w-full lg:hidden">
            <Image src={c.image} alt={c.imageAlt} fill unoptimized={rawImage(c.image)} sizes="100vw" className="object-cover object-top" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
