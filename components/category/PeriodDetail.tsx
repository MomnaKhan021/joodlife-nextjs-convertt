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
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Norethisterone treatment card */}
      <Reveal
        as="div"
        className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/15 bg-white/10 p-6 md:p-8"
      >
        <p className="max-w-[42ch] font-ui text-[15px] leading-relaxed text-white/90">
          Take control of your period safely and reliably. Whether it&rsquo;s for holidays,
          weddings, or important events, Norethisterone is clinically approved and delivered
          discreetly to help you stay in control.
        </p>
        <div className="relative mt-6 h-[160px] w-full">
          <Image
            src="/assets/category/period-hand.png"
            alt="Hand holding a Norethisterone tablet"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 520px"
            className="object-contain object-left-bottom"
          />
        </div>
      </Reveal>

      {/* Cycle & hormone health card */}
      <Reveal
        as="div"
        delay={120}
        className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[20px] border border-white/15 bg-black/15 p-6 md:p-8"
      >
        <h3 className="relative z-10 max-w-[18ch] font-display text-[24px] font-semibold leading-tight text-white md:text-[28px]">
          Understand Your Cycle and Hormone Health
        </h3>

        {/* hormone tag cloud */}
        <ul aria-hidden className="relative z-0 mt-5 flex flex-1 flex-wrap content-start gap-2 opacity-70">
          {TAGS.concat(TAGS).map((t, i) => (
            <li
              key={`${t}-${i}`}
              className="rounded-full border border-white/25 px-3 py-1 font-ui text-[11px] text-white/80"
            >
              {t}
            </li>
          ))}
        </ul>

        {/* portrait anchored bottom-right */}
        <div className="pointer-events-none absolute bottom-0 right-0 z-0 h-[280px] w-[58%]">
          <Image
            src="/assets/category/period-cycle.png"
            alt="Woman reflecting on her cycle and hormone health"
            fill
            quality={88}
            sizes="320px"
            className="object-contain object-bottom"
          />
        </div>

        <div className="relative z-10 mt-6">
          <Link
            href="/period-delay#assessment"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[#3a0d20] px-7 font-ui text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#2d0a19]"
          >
            Check Your Eligibility
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
