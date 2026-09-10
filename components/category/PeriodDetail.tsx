import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

/**
 * Period-delay section content (Figma Component 291, below the hero):
 *   • Norethisterone treatment card — copy + hand/pill image
 *   • "Understand Your Cycle and Hormone Health" card — portrait over a
 *     hormone tag cloud + eligibility CTA
 */

// Hormone / cycle vocabulary from the Figma tag cloud. Split across rows
// that auto-scroll in alternating directions behind the portrait.
const TAG_ROWS: { text: string; on?: boolean }[][] = [
  [
    { text: "Period Delay" },
    { text: "Hormone Balance", on: true },
    { text: "Progesterone" },
    { text: "Ovulation" },
    { text: "Hormones" },
  ],
  [
    { text: "Cycle Tracker" },
    { text: "Follicle", on: true },
    { text: "Menstrual Health" },
    { text: "Oestrogen" },
    { text: "LH" },
  ],
  [
    { text: "Norethisterone" },
    { text: "Triiodothyronine (T3)" },
    { text: "Thyroid-Stimulating Hormone", on: true },
    { text: "Luteal phase" },
  ],
];

export default function PeriodDetail() {
  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
      {/* Norethisterone treatment card */}
      <Reveal
        as="div"
        className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[16px] md:rounded-[24px] bg-black/12 px-5 pb-6 pt-8 backdrop-blur-[20px] md:p-8"
      >
        <p className="max-w-[42ch] font-ui text-[15px] leading-relaxed text-white/90">
          Delay your period safely and discreetly when you need to. Whether you&rsquo;re
          travelling, attending a special event or planning ahead, our UK clinicians can
          assess whether norethisterone is appropriate for you.
        </p>
        <div className="relative -mb-6 mt-6 h-[260px] w-full sm:h-[300px] md:-mb-8 md:h-[340px]">
          <Image
            src="/assets/category/period-hand.png"
            alt="Hand holding a Norethisterone tablet"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 520px"
            className="object-contain object-bottom"
          />
        </div>
      </Reveal>

      {/* Cycle & hormone health card — centred heading, hormone tag cloud
          filling the card, the portrait centred at the bottom, and the CTA
          centred over it (Figma). */}
      <Reveal
        as="div"
        delay={120}
        className="relative flex min-h-[380px] flex-col items-center overflow-hidden rounded-[16px] md:rounded-[24px] bg-black/12 px-5 pb-6 pt-8 backdrop-blur-[20px] md:min-h-[420px] md:p-8"
      >
        <h3 className="relative z-10 max-w-[20ch] text-center font-display text-[24px] font-semibold leading-tight text-white md:text-[28px]">
          Understand Your Cycle and Hormone Health
        </h3>

        {/* Hormone tag cloud — rows auto-scroll in alternating directions
            behind the portrait (Figma). Two copies per row so the -50%
            marquee loops seamlessly; paused for prefers-reduced-motion. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-center gap-2.5 overflow-hidden px-2 opacity-45"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%)",
          }}
        >
          {TAG_ROWS.map((row, r) => (
            <div
              key={r}
              className="animate-marquee flex w-max gap-2"
              style={{
                animationDuration: `${34 + r * 8}s`,
                animationDirection: r % 2 === 1 ? "reverse" : "normal",
              }}
            >
              {[...row, ...row, ...row, ...row].map((t, i) => (
                <span
                  key={`${t.text}-${i}`}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 font-ui text-[11px] ${
                    t.on
                      ? "border-white/50 bg-white/15 text-white"
                      : "border-white/25 text-white/80"
                  }`}
                >
                  {t.text}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* portrait at the bottom, sitting left of centre (Figma).
            Smaller + centred on mobile so she doesn't sink into the heading/tags. */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] h-[250px] w-[92%] max-w-[340px] -translate-x-1/2 md:left-[2%] md:h-[300px] md:w-[62%] md:translate-x-0">
          <Image
            src="/assets/category/period-cycle.png"
            alt="Woman reflecting on her cycle and hormone health"
            fill
            quality={88}
            sizes="320px"
            className="object-contain object-bottom"
          />
        </div>

        {/* CTA centred at the bottom, above the portrait */}
        <div className="relative z-10 mt-auto pt-6">
          <Link
            href="/consultation?product=period-delay"
            className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-[#3a0d20] px-7 font-ui text-[14px] font-semibold text-white hover:bg-[#2d0a19]"
          >
            Check Your Eligibility
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
