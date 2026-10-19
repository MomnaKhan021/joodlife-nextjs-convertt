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
function MessageCard({ c, className = "", float = true }: { c: LanderHero; className?: string; float?: boolean }) {
  return (
    <div className={`${float ? "fnd-float " : ""}flex flex-col gap-[8px] rounded-[10px] border border-white/10 bg-[linear-gradient(160deg,rgba(14,38,33,0.94)_0%,rgba(14,38,33,0.84)_100%)] p-[12px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] lg:gap-[16px] lg:rounded-[16px] lg:p-[16px] ${className}`}>
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
        {/* Phones: the tall crop. Tablet and up: the wide photo.
            The default hillside photo has a lot of sky above her, so on phones
            it is zoomed 1.55× — anchored so her head sits just under the logo and
            she fills the hero, slightly right of centre (client request, 20 Oct). A photo
            chosen in the CMS is shown unzoomed. */}
        <Image
          src={c.mobileImage || c.image}
          alt={c.imageAlt}
          fill
          priority
          unoptimized={rawImage(c.mobileImage || c.image)}
          sizes="100vw"
          quality={95}
          className={`object-cover object-top md:hidden ${
            (c.mobileImage || c.image).endsWith("/hero-hike-mobile.webp") ? "scale-[1.55] origin-[70%_48%]" : ""
          }`}
        />
        <Image
          src={c.image}
          alt={c.imageAlt}
          fill
          priority
          unoptimized={rawImage(c.image)}
          sizes="100vw"
          quality={95}
          className="hidden object-cover object-[78%_12%] md:block"
        />

        {/* Brand-green shade under the copy (CMS: "Darken the photo behind the
            text"; always on with the default photos). Phones: the copy sits
            at the bottom, so the green rises from the bottom and leaves the
            face clear at the top. Desktop: the green runs in from the left
            behind the copy and fades out before the subject on the right. */}
        {c.overlay ? (
          <>
            <div
              aria-hidden
              className="absolute inset-0 md:hidden"
              style={{ background: "linear-gradient(180deg, rgba(14,38,33,0) 22%, rgba(14,38,33,0.45) 38%, rgba(14,38,33,0.86) 56%, rgba(14,38,33,0.95) 100%)" }}
            />
            {/* Tablets: the copy runs ~75% of the width here, so the green
                reaches further across before fading. */}
            <div
              aria-hidden
              className="absolute inset-0 hidden md:block lg:hidden"
              style={{
                background:
                  "linear-gradient(90deg, rgba(14,38,33,0.92) 0%, rgba(14,38,33,0.85) 45%, rgba(14,38,33,0.55) 68%, rgba(14,38,33,0.15) 85%, rgba(14,38,33,0) 95%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 hidden lg:block"
              style={{
                background:
                  "linear-gradient(90deg, rgba(14,38,33,0.92) 0%, rgba(14,38,33,0.82) 30%, rgba(14,38,33,0.5) 48%, rgba(14,38,33,0.12) 62%, rgba(14,38,33,0) 72%), " +
                  // darker bottom-right corner under the WhatsApp card
                  "radial-gradient(ellipse 42% 48% at 88% 100%, rgba(14,38,33,0.72) 0%, rgba(14,38,33,0.35) 45%, rgba(14,38,33,0) 75%), " +
                  "linear-gradient(0deg, rgba(14,38,33,0.35) 0%, rgba(14,38,33,0) 30%)",
              }}
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

            {/* 20px between the button and the card on phones/tablets (12px is
                enough on desktop, where the card isn't under the button). */}
            <div className="flex flex-col gap-[20px] lg:gap-[12px]">
              <Reveal delay={300 + c.bullets.length * 110}>
                <LpCta tone="light" label={c.ctaLabel} href={c.ctaHref} />
              </Reveal>
              {/* Phones and tablets: the card sits under the button */}
              {hasCard ? (
                <Reveal delay={420 + c.bullets.length * 110} className="lg:hidden">
                  {/* No bobbing here: it sits right under the button, and the
                      float animation lifted it into the button. */}
                  <MessageCard c={c} float={false} />
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
