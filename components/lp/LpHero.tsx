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
 * The hero follows /wegovy-pills: a full-bleed photo under a dark-green
 * gradient (from the left on desktop, from the bottom on phones) with the
 * copy in white over it. Desktop keeps the WhatsApp-style card floating at
 * the bottom right. Sized so the whole hero (with the top bar and logo
 * header) fits a laptop screen without scrolling.
 */
function CheckBadge() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#00b67a]">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function LpHero({ content: c, style }: { content: LanderHero; style?: SectionStyle }) {
  // A CMS colour shows behind the photo while it loads.
  const custom = style?.background;
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
        className="relative flex min-h-[620px] w-full items-end overflow-hidden bg-[#142e2a] md:min-h-[clamp(560px,calc(100svh-103px),700px)] md:items-center"
        style={isColour(custom) ? { background: custom } : undefined}
      >
        <Image
          src={c.image}
          alt={c.imageAlt}
          fill
          priority
          unoptimized={rawImage(c.image)}
          sizes="100vw"
          className="object-cover object-[70%_top] md:object-right"
        />

        {/* Phones — dark at the bottom, under the copy */}
        <div
          aria-hidden
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,46,42,0.1) 0%, rgba(20,46,42,0.55) 45%, rgba(20,46,42,0.95) 100%)",
          }}
        />
        {/* Desktop — dark on the left, under the copy */}
        <div
          aria-hidden
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(20,46,42,0.95) 0%, rgba(20,46,42,0.85) 34%, rgba(20,46,42,0.4) 56%, rgba(20,46,42,0) 78%)",
          }}
        />

        <div className={`relative z-10 mx-auto w-full max-w-[1440px] py-12 md:py-16 ${LP_GUTTER}`}>
          <div className="max-w-[720px]">
            {/* Trustpilot */}
            <Reveal delay={60}>
              <TrustpilotLink className="mb-5 flex w-fit flex-wrap items-center gap-2">
                <Image src="/assets/icons/trustpilot-logo-dark.svg" alt="Trustpilot" width={74} height={18} className="h-[18px] w-auto brightness-0 invert" />
                <Image src="/assets/icons/trustpilot-stars.svg" alt={`${c.rating} stars`} width={86} height={16} className="h-4 w-auto" />
                <span className="font-ui text-[14.2px] text-white/90">
                  <strong className="font-semibold">{c.rating}</strong> out of 5
                </span>
              </TrustpilotLink>
            </Reveal>

            <Reveal delay={150}>
              <h1 className="font-display text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] text-white sm:text-[32px] md:text-[40px] lg:text-[46px] lg:leading-[1.1]">
                {c.title}
                {c.titleAccent ? (
                  <>
                    <br />
                    <span className="font-serif font-normal italic">{c.titleAccent}</span>
                  </>
                ) : null}
              </h1>
            </Reveal>

            <Reveal delay={260} className="mt-7">
              <LpCta tone="light" label={c.ctaLabel} href={c.ctaHref} />
            </Reveal>

            <ul className="mt-7 flex flex-col gap-3">
              {c.bullets.map((t, i) => (
                <Reveal as="li" key={t} delay={360 + i * 110} className="flex items-center gap-3">
                  <CheckBadge />
                  <span className="font-ui text-[14px] font-light leading-[20px] text-white/90 md:text-[15px]">{t}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        {/* WhatsApp-style message card — desktop, bottom right */}
        {c.cardName || c.cardMessage ? (
          <div className={`pointer-events-none absolute inset-x-0 bottom-[40px] z-10 mx-auto hidden w-full max-w-[1440px] justify-end lg:flex ${LP_GUTTER}`}>
            <Reveal delay={650}>
              <div className="fnd-float flex flex-col gap-[16px] rounded-[16px] bg-black/30 p-[16px] backdrop-blur-[82px]">
                <Image src={`${LP_ASSETS}/logo-white.svg`} alt="Jood" width={73} height={23} unoptimized className="h-[23px] w-[73px] self-start" />
                <div className="flex flex-col gap-[7px] text-white">
                  <p className="font-ui text-[17px] font-medium">
                    {c.cardName} <span className="font-light">{c.cardChannel}</span>
                  </p>
                  <p className="w-[276px] font-ui text-[16px] font-light leading-[19.6px]">{c.cardMessage}</p>
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}
      </section>
    </>
  );
}
