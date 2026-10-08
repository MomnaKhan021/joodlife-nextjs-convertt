import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO } from "@/lib/foundayoContent";
import { BODY, BTN_WHITE } from "./type";

/**
 * Hero — from Figma 2003:1228 / 2003:564, but shorter than the frames
 * (749 / 607px): about 72% of the screen on desktop (capped at 600px) so
 * the next section peeks above the fold, 520px mobile.
 * Full-bleed photo, copy in white on the left over a dark wash that is
 * heaviest on the left and along the bottom so the text always reads:
 * 50/55 headline (32/35.2 mobile), 18.3/23.8 intro (16/20.8 mobile),
 * Trustpilot row, 372×50 white CTA (full width on mobile), reassurance
 * line and three ticked bullets.
 */
function Tick() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
      <path d="M3 9.5l3.8 3.6L15 5" stroke="#8fe0a4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const c = FOUNDAYO.hero;
  return (
    <section
      aria-label="Weight loss tablet — tried every diet?"
      className="relative flex min-h-[520px] w-full items-end overflow-hidden bg-[#3b2a24] md:min-h-[min(560px,72vh)] md:items-center lg:min-h-[min(600px,72vh)]"
    >
      {/* Static photo: the old slow zoom (transform: scale) made the browser
          rasterise the image once and stretch it, which read as blur. */}
      <div className="absolute inset-0">
        <Image
          src={c.image}
          alt={c.imageAlt}
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-[72%_center] md:object-[center_35%]"
        />
      </div>
      {/* Legibility wash. Mobile: the copy sits at the bottom, so darken from
          mid-frame down. Desktop: a left-to-right wash behind the copy plus a
          lighter one along the bottom edge. */}
      <div
        aria-hidden
        className="absolute inset-0 md:hidden"
        style={{ background: "linear-gradient(180deg, rgba(30,18,14,0.1) 0%, rgba(30,18,14,0.4) 32%, rgba(30,18,14,0.82) 62%, rgba(30,18,14,0.92) 100%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(30,18,14,0.84) 0%, rgba(30,18,14,0.72) 28%, rgba(30,18,14,0.4) 52%, rgba(30,18,14,0) 72%), " +
            "linear-gradient(180deg, rgba(30,18,14,0) 60%, rgba(30,18,14,0.45) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-[22px] pt-10 md:px-10 md:py-[40px] lg:px-[60px]">
        {/* Text shadow so the white copy holds up over the busy photo (QA: WCAG contrast). */}
        <div className="max-w-[372px] [text-shadow:0_2px_8px_rgba(0,0,0,0.4)] md:max-w-[540px]">
          <Reveal delay={60}>
            <h1 className="text-white">
              <span className="block font-display text-[32px] font-semibold leading-[35.2px] tracking-[-1.6px] md:text-[50px] md:leading-[55px]">
                {c.title}
              </span>
              <em className="block font-serif text-[32px] font-normal italic leading-[35.2px] tracking-[-1.6px] md:text-[50px] md:leading-[55px]">
                {c.titleAccent}
              </em>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-3 font-ui text-[16px] leading-[20.8px] tracking-[-0.3px] text-white md:mt-[14px] md:text-[18.3px] md:leading-[23.8px]">
              {c.body}
            </p>
          </Reveal>

          <Reveal delay={300}>
            <a
              href="https://www.trustpilot.com/review/joodlife.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Read our reviews on Trustpilot (opens in a new tab)"
              className="mt-[10px] flex w-fit flex-wrap items-center gap-2 transition-opacity hover:opacity-85 md:mt-5"
            >
              <Image src="/assets/icons/trustpilot-logo-dark.svg" alt="Trustpilot" width={74} height={18} className="h-[18px] w-auto brightness-0 invert" />
              <Image src="/assets/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} className="h-4 w-auto" />
              <span className="font-ui text-[14.2px] leading-[17px] tracking-[-0.4px] text-white">
                <strong className="font-bold">4.4</strong> {c.reviewsLabel}
              </span>
            </a>
          </Reveal>

          <Reveal delay={400}>
            <EligibilityCta
              product="weight-loss"
              href={c.ctaHref}
              label={c.ctaLabel}
              className={`fnd-lift mt-[14px] w-full [text-shadow:none] md:mt-5 md:w-[372px] ${BTN_WHITE}`}
            />
          </Reveal>

          <Reveal delay={480}>
            <p className="mt-3 font-ui text-[15.3px] leading-[19.5px] tracking-[-0.3px] text-white/95 md:mt-3">{c.reassurance}</p>
          </Reveal>

          <ul className="mt-[13px] flex flex-col gap-[13px] md:mt-4 md:gap-3">
            {c.bullets.map((b, i) => (
              <Reveal as="li" key={b} delay={560 + i * 110} className="flex items-center gap-[10px]">
                <Tick />
                <span className={`${BODY} text-white`}>{b}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
