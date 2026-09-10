import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import TestimonialCarousel, {
  type Testimonial,
} from "@/components/category/TestimonialCarousel";

/**
 * Erectile-dysfunction home-page section content — Figma "Home Page - 2026"
 * Component 295 (desktop) / 296 (mobile), the cards below the portrait:
 *   • treatment card — copy + pill + CTA   (1226×339 / 358×486)
 *   • "What are your goals?" photo card     (651×407  / 358×375)
 *   • patient testimonial carousel          (560×407  / 358×339)
 * Copy and geometry are lifted from the file, not paraphrased.
 */

const START = "/consultation?product=erectile-dysfunction";

const GOALS = [
  "Address erectile difficulties",
  "Improve sexual confidence",
  "All the above",
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "This treatment completely restored my confidence. I no longer worry about performance, and I feel in control",
    name: "Jordan, 42,",
    meta: "2 month completed",
  },
  {
    quote:
      "I feel like myself again. My confidence has improved, and intimacy no longer feels stressful.",
    name: "Michael, 46,",
    meta: "6 weeks completed",
  },
  {
    quote:
      "I noticed a real difference in my performance and confidence. It’s helped me feel more in control again.",
    name: "David, 39,",
    meta: "1 month completed",
  },
  {
    quote:
      "This has made a big impact on both my confidence and my relationship. I feel much more relaxed and reassured now.",
    name: "Chris, 51,",
    meta: "7 weeks completed",
  },
];

export default function EdDetail() {
  return (
    <div className="flex flex-col gap-4 md:gap-[15px]">
      {/* Treatment card. Desktop: 339 tall, no blur, copy 498 wide inset 48,
          pill centred in the remaining track, 183×50 button inset 54.
          Mobile: frosted, 49px vertical inset, stacked with 23px gaps. */}
      <Reveal
        as="div"
        className="grid items-center gap-[23px] rounded-[16px] bg-black/12 px-6 pb-[49px] pt-[49px] backdrop-blur-[20px] md:min-h-[339px] md:grid-cols-[498px_1fr_183px] md:gap-0 md:rounded-[24px] md:py-0 md:pl-12 md:pr-[54px] md:backdrop-blur-none"
      >
        <p className="font-ui text-[20px] font-medium leading-[23px] tracking-[-0.49px] text-white md:text-[25px] md:leading-[26px]">
          Take control of erectile health safely and discreetly. Clinically approved treatments are delivered to your door, helping you regain confidence and performance.
        </p>
        <div className="relative mx-auto h-[179px] w-[188px]">
          <Image
            src="/assets/category/ed-pill-2.webp"
            alt="ED treatment tablet"
            fill
            quality={90}
            sizes="188px"
            className="object-contain"
          />
        </div>
        <Link
          href={START}
          className="btn-cta inline-flex h-[50px] w-full items-center justify-center rounded-lg border border-[#d3dabe] bg-[#142e2a] font-ui text-[16px] font-medium leading-5 tracking-[-0.32px] text-white hover:bg-[#0c2421] md:w-[183px] md:justify-self-end"
        >
          Get Started
        </Link>
      </Reveal>

      {/* Goals photo card + testimonial. Figma: 651 : 560 with a 15px gap. */}
      <div className="grid grid-cols-1 gap-4 md:gap-[15px] lg:grid-cols-[651fr_560fr]">
        <Reveal
          as="div"
          className="relative aspect-[358/375] min-w-0 overflow-hidden rounded-[16px] md:aspect-auto md:h-[407px] md:rounded-[24px]"
        >
          {/* Two exports: the mobile card is a different crop/photo. */}
          <Image
            src="/assets/category/ed-goals-m.jpg"
            alt="Man considering his treatment goals"
            fill
            quality={90}
            sizes="(max-width: 768px) 96vw, 1px"
            className="object-cover md:hidden"
          />
          <Image
            src="/assets/category/ed-goals-d.jpg"
            alt="Man considering his treatment goals"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 651px"
            className="hidden object-cover md:block"
          />
          <h3 className="absolute left-[21px] top-[34px] font-ui text-[25px] font-bold leading-[26px] tracking-[-0.49px] text-white md:left-12 md:top-16">
            <span className="md:hidden">What&rsquo;s your goal?</span>
            <span className="hidden md:inline">What are your goals?</span>
          </h3>
          {/* Goal chips: 48 tall, 26px side padding, 17% white + blur.
              Stacked left on mobile (Figma y142–296), right-aligned on
              desktop with the last chip 41px off the card's foot. */}
          <ul className="absolute bottom-[79px] left-[21px] flex flex-col items-start gap-[5px] md:bottom-[41px] md:left-auto md:right-7 md:items-end">
            {GOALS.map((g) => (
              <li
                key={g}
                className="inline-flex h-12 items-center whitespace-nowrap rounded-full bg-white/17 px-[26px] font-ui text-[16px] font-medium leading-5 tracking-[-0.32px] text-white backdrop-blur-[20px]"
              >
                {g}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="div" delay={120} className="min-w-0">
          <TestimonialCarousel items={TESTIMONIALS} />
        </Reveal>
      </div>
    </div>
  );
}
