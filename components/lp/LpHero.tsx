import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import type { LanderHero } from "@/lib/landerContentTypes";
import { isColour, type SectionStyle } from "@/lib/sectionStyle";

import { LP_ASSETS, LP_GUTTER, LpCta, TrustpilotLink, rawImage } from "./shared";

/**
 * Top bar + logo header + hero. No site menu on purpose — this page is the
 * destination for paid ads, so the only way forward is the CTA.
 *
 * Hero (Figma 118:319): a full-bleed photo — wide on tablet/desktop, a tall
 * crop on phones — with the copy in white over it. Desktop: copy on the
 * left, the WhatsApp-style card floating bottom right, and the whole hero
 * (with the bars above) fits a laptop screen. Phones: copy at the bottom
 * over the photo's dark fade, the card full width under the button.
 */
function MessageCard({ c, className = "" }: { c: LanderHero; className?: string }) {
  return (
    <div className={`fnd-float flex flex-col gap-[8px] rounded-[10px] bg-black/30 p-[12px] backdrop-blur-[82px] lg:gap-[16px] lg:rounded-[16px] lg:p-[16px] ${className}`}>
      <Image src={`${LP_ASSETS}/logo-white.svg`} alt="Jood" width={73} height={23} unoptimized className="h-[15px] w-[47px] self-start lg:h-[23px] lg:w-[73px]" />
      <div className="flex flex-col gap-[2px] text-white lg:gap-[7px]">
        <p className="font-ui text-[14px] font-medium lg:text-[17px]">
          {c.cardName} <span className="font-light">{c.cardChannel}</span>
        </p>
        <p className="font-ui text-[12px] font-light leading-[17.6px] lg:w-[276px] lg:text-[16px] lg:leading-[19.6px]">{c.cardMessage}</p>
      </div>
    </div>
  );
}

export default function LpHero({ content: c, style }: { content: LanderHero; style?: SectionStyle }) {
  // A CMS colour shows behind the photo while it loads.
  const custom = style?.background;
  const hasCard = !!(c.cardName || c.cardMessage);
  return (
    <>
      {c.topBar.trim() ? (
        <div className="bg-[#142e2a] px-4 py-[12px] text-center font-ui text-[14px] font-medium leading-[16.9px] tracking-[-0.3px] text-white">
          {c.topBar}
        </div>
      ) : null}

      {/* Logo header — 95×30 logo, centred; links to the home page */}
      <header className="flex items-center justify-center bg-white px-4 py-[16px] lg:px-[60px]">
        <Link href="/" aria-label="Jood home">
          <Image
            src={`${LP_ASSETS}/logo-header.svg`}
            alt="Jood"
            width={95}
            height={30}
            priority
            unoptimized
            className="h-[24px] w-auto lg:h-[30px]"
          />
        </Link>
      </header>

      <section
        className="relative flex min-h-[740px] w-full items-end overflow-hidden bg-[#142e2a] md:min-h-[clamp(560px,calc(100svh-103px),700px)] md:items-center"
        style={isColour(custom) ? { background: custom } : undefined}
      >
        {/* Phones: the tall crop. Tablet and up: the wide photo. */}
        <Image
          src={c.mobileImage || c.image}
          alt={c.imageAlt}
          fill
          priority
          unoptimized={rawImage(c.mobileImage || c.image)}
          sizes="100vw"
          className="object-cover object-top md:hidden"
        />
        <Image
          src={c.image}
          alt={c.imageAlt}
          fill
          priority
          unoptimized={rawImage(c.image)}
          sizes="100vw"
          className="hidden object-cover object-[60%_30%] md:block"
        />

        {/* Optional shade under the copy (CMS: "Darken the photo behind the text")
            — from the bottom on phones, the left on desktop. Off by default:
            the hero photos carry their own darkening. */}
        {c.overlay ? (
          <>
            <div
              aria-hidden
              className="absolute inset-0 md:hidden"
              style={{ background: "linear-gradient(180deg, rgba(20,46,42,0) 30%, rgba(20,46,42,0.55) 55%, rgba(20,46,42,0.9) 100%)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 hidden md:block"
              style={{ background: "linear-gradient(90deg, rgba(12,30,27,0.6) 0%, rgba(12,30,27,0.35) 35%, rgba(12,30,27,0) 62%)" }}
            />
          </>
        ) : null}

        <div className={`relative z-10 mx-auto w-full max-w-[1440px] pb-[16px] pt-[40px] md:py-[48px] ${LP_GUTTER}`}>
          <div className="flex w-full flex-col gap-[24px] md:w-[564px] lg:gap-[42px]">
            <div className="flex flex-col gap-[10px] lg:gap-[16px]">
              {/* Trustpilot micro combo */}
              <Reveal delay={60}>
                <TrustpilotLink className="flex w-fit items-center gap-[8px] lg:gap-[9px]">
                  <span className="flex items-center gap-[5px]">
                    <Image src={`${LP_ASSETS}/tp-star.svg`} alt="" width={21} height={20} unoptimized className="h-[16px] w-auto lg:h-[20px]" />
                    <span className="font-ui text-[14px] font-medium leading-[16px] text-[#f7f9f2] lg:text-[16px]">Trustpilot</span>
                  </span>
                  <Image src={`${LP_ASSETS}/tp-stars.svg`} alt="Rated 5 stars" width={123} height={23} unoptimized className="h-[16px] w-auto lg:h-[23px]" />
                  <span className="font-ui text-[15px] font-medium leading-[16px] tracking-[-0.3px] text-[#f7f9f2] lg:text-[16px]">
                    <strong className="font-bold">{c.rating}</strong> out of 5
                  </span>
                </TrustpilotLink>
              </Reveal>

              {/* Headline — Gilroy 56/1.1 (36/39.6 on phones), accent inline */}
              <Reveal delay={150}>
                <h1 className="font-display text-[36px] !font-semibold leading-[39.6px] tracking-[-1.6px] text-white lg:text-[56px] lg:leading-[1.1] lg:tracking-[-2.24px]">
                  <span className="lg:capitalize">{c.title}</span>
                  {c.titleAccent ? (
                    <>
                      {" "}
                      <em className="font-serif font-normal italic tracking-[-0.64px]">{c.titleAccent}</em>
                    </>
                  ) : null}
                </h1>
              </Reveal>

              {/* Ticks — one after another */}
              <ul className="flex flex-col gap-[8px]">
                {c.bullets.map((t, i) => (
                  <Reveal as="li" key={t} delay={280 + i * 110} className="flex items-center gap-[12px]">
                    <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#d3dabe] lg:size-[22px]">
                      <Image src={`${LP_ASSETS}/hero-tick.svg`} alt="" width={13} height={12} unoptimized />
                    </span>
                    <span className="font-ui text-[16px] font-light leading-[24px] tracking-[-0.3px] text-[#f7f9f2] lg:text-[18px] lg:leading-[27px]">{t}</span>
                  </Reveal>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-[12px]">
              <Reveal delay={300 + c.bullets.length * 110}>
                <LpCta tone="light" label={c.ctaLabel} href={c.ctaHref} />
              </Reveal>
              {/* Phones and tablets: the card sits under the button */}
              {hasCard ? (
                <Reveal delay={420 + c.bullets.length * 110} className="lg:hidden">
                  <MessageCard c={c} />
                </Reveal>
              ) : null}
            </div>
          </div>
        </div>

        {/* Desktop: the card floats bottom right */}
        {hasCard ? (
          <div className={`pointer-events-none absolute inset-x-0 bottom-[40px] z-10 mx-auto hidden w-full max-w-[1440px] justify-end lg:flex ${LP_GUTTER}`}>
            <Reveal delay={650}>
              <MessageCard c={c} />
            </Reveal>
          </div>
        ) : null}
      </section>
    </>
  );
}
