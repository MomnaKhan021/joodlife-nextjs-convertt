import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import TestimonialCarousel, {
  type Testimonial,
} from "@/components/category/TestimonialCarousel";

/**
 * Erectile-dysfunction section content (Figma Component 290, below the
 * hero):
 *   • treatment card — copy + pill image + CTA
 *   • "What are your goals?" image card + a patient testimonial carousel
 */

const GOALS = [
  "Improve erections",
  "Boost sexual confidence",
  "Improve intimacy",
  "All of the above",
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Treatment helped restore my confidence. I feel more in control and no longer worry about my erections.",
    name: "Jordan, 42",
    meta: "2 months into treatment",
  },
  {
    quote:
      "I feel like myself again. My confidence has improved, and intimacy no longer feels stressful.",
    name: "Michael, 46",
    meta: "6 weeks completed",
  },
  {
    quote:
      "I noticed a real difference in my performance and confidence. It's helped me feel more in control again.",
    name: "David, 39",
    meta: "1 month completed",
  },
  {
    quote:
      "This has made a big impact on both my confidence and my relationship. I feel much more relaxed and reassured now.",
    name: "Chris, 51",
    meta: "7 weeks completed",
  },
];

export default function EdDetail() {
  return (
    <div className="flex flex-col gap-5">
      {/* Treatment card */}
      <Reveal
        as="div"
        className="grid min-h-[300px] items-center gap-6 rounded-[24px] bg-black/12 p-6 backdrop-blur-[20px] md:min-h-[330px] md:grid-cols-[1.3fr_auto_auto] md:p-8"
      >
        <p className="max-w-[46ch] font-ui text-[15px] leading-relaxed text-white/90">
          Take control of erectile health safely and discreetly. Clinically approved treatments are
          delivered to your door, helping you regain confidence and performance.
        </p>
        <div className="relative mx-auto h-[120px] w-[180px]">
          <Image
            src="/assets/category/ed-pill.png"
            alt="Clinically approved ED treatment tablet"
            fill
            quality={90}
            sizes="180px"
            className="object-contain"
          />
        </div>
        <Link
          href="/consultation?product=erectile-dysfunction"
          className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-[#0c2a3a] px-7 font-ui text-[14px] font-semibold text-white hover:bg-[#08222f] md:justify-self-end"
        >
          Get Started
        </Link>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Goals card — heading top-left, goal chips centred on the right
            over the portrait (Figma). */}
        <Reveal as="div" className="relative min-h-[360px] overflow-hidden rounded-[24px] md:min-h-[400px]">
          <Image
            src="/assets/category/ed-goals.png"
            alt="Man considering his treatment goals"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 620px"
            className="object-cover object-center"
          />
          <div aria-hidden className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col p-6 md:p-8">
            <h3 className="font-display text-[24px] font-semibold leading-tight text-white md:text-[28px]">
              What are your goals?
            </h3>
            <ul className="flex flex-1 flex-col items-end justify-center gap-2.5">
              {GOALS.map((g) => (
                <li
                  key={g}
                  className="w-fit rounded-full bg-white/15 px-4 py-2 text-right font-ui text-[13px] font-medium text-white backdrop-blur-sm"
                >
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Testimonial carousel */}
        <Reveal as="div" delay={120}>
          <TestimonialCarousel items={TESTIMONIALS} />
        </Reveal>
      </div>
    </div>
  );
}
