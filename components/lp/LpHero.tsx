import Image from "next/image";

import type { LanderHero } from "@/lib/landerContentTypes";
import { isColour, type SectionStyle } from "@/lib/sectionStyle";

import { FONT_POPPINS, LP_ASSETS, LP_GRADIENT, LP_GUTTER, LpCta, TrustpilotLink, rawImage } from "./shared";

/**
 * Top bar + logo header + green hero (Figma 20:331, 20:333, 20:339;
 * mobile 20:824, 20:840). No site menu on purpose — this page is the
 * destination for paid ads, so the only way forward is the CTA.
 */
export default function LpHero({ content: c, style }: { content: LanderHero; style?: SectionStyle }) {
  // A CMS background replaces the brand gradient; otherwise the gradient.
  const custom = style?.background;
  const bg = isColour(custom) ? { background: custom } : { backgroundImage: LP_GRADIENT };
  return (
    <>
      {c.topBar.trim() ? (
        <div className="bg-[#142e2a] px-4 py-[12px] text-center font-ui text-[14px] font-medium leading-[16.9px] tracking-[-0.32px] text-white">
          {c.topBar}
        </div>
      ) : null}

      {/* Logo header — 95×30 logo, centred */}
      <header className="flex items-center justify-center bg-white px-4 py-[16px] lg:px-[60px]">
        <Image
          src={`${LP_ASSETS}/logo-header.svg`}
          alt="Jood"
          width={95}
          height={30}
          priority
          unoptimized
          className="h-[24px] w-auto lg:h-[30px]"
        />
      </header>

      <section className="relative overflow-hidden pt-[40px] lg:pt-0" style={bg}>
        <div
          className={`mx-auto flex max-w-[1440px] flex-col gap-[32px] lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:py-[80px] ${LP_GUTTER} max-lg:px-0`}
        >
          {/* Copy column — 564 wide on desktop */}
          <div className="flex w-full flex-col gap-[24px] px-4 lg:w-[564px] lg:shrink-0 lg:gap-[42px] lg:px-0">
            <div className="flex flex-col gap-[10px] lg:gap-[16px]">
              {/* Trustpilot micro combo */}
              <TrustpilotLink className="flex w-fit items-center gap-[8px] lg:gap-[9px]">
                <span className="flex items-center gap-[5px]">
                  <Image src={`${LP_ASSETS}/tp-star.svg`} alt="" width={21} height={20} unoptimized className="h-[16px] w-auto lg:h-[20px]" />
                  <span style={FONT_POPPINS} className="text-[14px] font-medium leading-[16px] text-[#f7f9f2] lg:text-[16px]">Trustpilot</span>
                </span>
                <Image src={`${LP_ASSETS}/tp-stars.svg`} alt="Rated 5 stars" width={123} height={23} unoptimized className="h-[16px] w-auto lg:h-[23px]" />
                <span style={FONT_POPPINS} className="text-[16px] font-medium leading-[16px] text-[#f7f9f2]">
                  <strong className="font-bold">{c.rating}</strong> out of 5
                </span>
              </TrustpilotLink>

              {/* Headline — Gilroy 56/1.1 (36/38 on phones) */}
              <h1 className="font-display text-[36px] !font-semibold leading-[38px] tracking-[-1.2px] text-white lg:text-[56px] lg:leading-[1.1] lg:tracking-[-2.24px]">
                <span className="lg:capitalize">{c.title}</span>
                {c.titleAccent ? (
                  <>
                    {" "}
                    <em className="font-serif font-normal italic tracking-[-0.64px]">{c.titleAccent}</em>
                  </>
                ) : null}
              </h1>

              {/* Ticks */}
              <ul className="flex flex-col gap-[8px]">
                {c.bullets.map((t) => (
                  <li key={t} className="flex items-center gap-[12px]">
                    <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#d3dabe] lg:size-[22px]">
                      <Image src={`${LP_ASSETS}/hero-tick.svg`} alt="" width={13} height={12} unoptimized />
                    </span>
                    <span className="font-ui text-[16px] leading-[24px] text-[#f7f9f2] lg:text-[18px] lg:leading-[27px]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <LpCta tone="light" label={c.ctaLabel} href={c.ctaHref} />
          </div>

          {/* Photo + WhatsApp-style message card */}
          <div className="relative h-[383px] w-full lg:size-[510px] lg:shrink-0">
            <Image
              src={c.image}
              alt={c.imageAlt}
              fill
              priority
              unoptimized={rawImage(c.image)}
              sizes="(max-width: 1024px) 100vw, 510px"
              className="object-cover object-[50%_16%] lg:rounded-[16px] lg:object-center"
            />
            {c.cardName || c.cardMessage ? (
              <div className="absolute inset-x-[4px] bottom-[7px] flex flex-col gap-[8px] rounded-[10px] bg-black/16 p-[12px] backdrop-blur-[82px] lg:inset-x-auto lg:bottom-auto lg:left-[231px] lg:top-[358px] lg:gap-[16px] lg:rounded-[16px] lg:p-[16px]">
                <Image src={`${LP_ASSETS}/logo-white.svg`} alt="Jood" width={73} height={23} unoptimized className="h-[15px] w-[47px] self-start lg:h-[23px] lg:w-[73px]" />
                <div className="flex flex-col gap-[2px] text-white lg:gap-[7px]">
                  <p className="font-ui text-[14px] font-medium lg:text-[17px]">
                    {c.cardName} <span className="font-light">{c.cardChannel}</span>
                  </p>
                  <p className="font-ui text-[12px] font-light leading-[17.6px] lg:w-[276px] lg:text-[16px] lg:leading-[19.6px]">
                    {c.cardMessage}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
