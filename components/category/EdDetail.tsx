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

const DEFAULT_GOALS = [
  "Improve erections",
  "Boost sexual confidence",
  "Improve intimacy",
  "All of the above",
];

const DEFAULT_TESTIMONIALS: Testimonial[] = [
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

export type EdDetailContent = {
  goals?: string[];
  testimonials?: Testimonial[];
};

export default function EdDetail({ goals, testimonials }: EdDetailContent = {}) {
  const GOALS = goals?.length ? goals : DEFAULT_GOALS;
  const TESTIMONIALS = testimonials?.length ? testimonials : DEFAULT_TESTIMONIALS;
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Treatment card */}
      <Reveal
        as="div"
        className="grid min-h-[300px] items-center gap-6 rounded-[16px] md:rounded-[24px] bg-black/12 px-5 pb-6 pt-8 backdrop-blur-[20px] md:min-h-[330px] md:grid-cols-[1.3fr_auto_auto] md:p-8"
      >
        <p className="max-w-[46ch] font-ui text-[15px] leading-relaxed text-white/90">
          Take control of your erectile health with safe, discreet, clinician-led care.
          Treatments are prescribed where appropriate and delivered directly to your door.
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
          className="btn-cta inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#0c2a3a] px-7 font-ui text-[14px] font-semibold text-white hover:bg-[#08222f] md:w-auto md:justify-self-end"
        >
          Start Your Assessment
        </Link>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        {/* Goals card — heading top-left, goal chips centred on the right
            over the portrait (Figma). min-w-0 lets the card shrink to the
            column instead of the carousel's content forcing an auto track
            wider than the viewport (clipped by the section's overflow). */}
        <Reveal as="div" className="relative min-w-0 min-h-[360px] overflow-hidden rounded-[16px] md:rounded-[24px] md:min-h-[400px]">
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
            <ul className="mt-auto flex flex-col items-start gap-2 md:mt-0 md:flex-1 md:items-end md:justify-center md:gap-2.5">
              {GOALS.map((g) => (
                <li
                  key={g}
                  className="max-w-full rounded-full bg-white/15 px-3 py-1.5 text-left font-ui text-[12px] font-medium text-white backdrop-blur-sm md:px-4 md:py-2 md:text-right md:text-[13px]"
                >
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Testimonial carousel */}
        <Reveal as="div" delay={120} className="min-w-0">
          <TestimonialCarousel items={TESTIMONIALS} />
        </Reveal>
      </div>
    </div>
  );
}
