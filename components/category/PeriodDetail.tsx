import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

/**
 * Period-delay section content (Figma Component 291, below the hero):
 *   • Norethisterone treatment card — copy + hand/pill image
 *   • "Understand Your Cycle and Hormone Health" card — portrait over a
 *     hormone tag cloud + eligibility CTA
 */

const TAGS = [
  "Hormones",
  "Period Delay",
  "Hormone Balance",
  "Progesterone",
  "Cycle Tracker",
  "Norethisterone",
  "Follicle",
  "Ovulation",
  "Menstrual Health",
  "Oestrogen",
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

        {/* hormone tag cloud — faint, fills the whole card */}
        <ul
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex flex-wrap content-center justify-center gap-2 p-6 opacity-40"
        >
          {TAGS.concat(TAGS, TAGS, TAGS).map((t, i) => (
            <li
              key={`${t}-${i}`}
              className="rounded-full border border-white/25 px-3 py-1 font-ui text-[11px] text-white/80"
            >
              {t}
            </li>
          ))}
        </ul>

        {/* portrait at the bottom, sitting left of centre (Figma).
            Smaller + centred on mobile so she doesn't sink into the heading/tags. */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] h-[190px] w-[68%] max-w-[320px] -translate-x-1/2 md:left-[2%] md:h-[300px] md:w-[62%] md:translate-x-0">
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
