import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

/**
 * "A treatment plan that works around you" — Figma node 67:2403.
 *
 * Full-bleed dark-green section. Desktop: left column = heading + lede +
 * "Choose your treatment" CTA; right column = a 2×3 grid of feature cards
 * (icon + title + small copy). Mobile: heading/CTA stack above the grid,
 * which becomes a single column.
 */

type Feature = {
  icon: string;
  title: string;
  copy: string;
};

const FEATURES: Feature[] = [
  {
    icon: "/assets/figma/feature-delivery.svg",
    title: "Discreet, next-day delivery",
    copy: "Next-day, unbranded, secure delivery with DPD.",
  },
  {
    icon: "/assets/figma/feature-support.svg",
    title: "24/7 expert support",
    copy: "Access experienced clinicians and coaches whenever you need.",
  },
  {
    icon: "/assets/figma/feature-trusted.svg",
    title: "Trusted by thousands",
    copy: "Chosen by patients nationwide for safe, effective care.",
  },
  {
    icon: "/assets/figma/feature-effective.svg",
    title: "Highly effective treatments",
    copy: "Modern, evidence-based medication options.",
  },
  {
    icon: "/assets/figma/feature-consult.svg",
    title: "Quick, easy consultation",
    copy: "Start online in minutes; simple, private, seamless.",
  },
  {
    icon: "/assets/figma/feature-progress.svg",
    title: "Track your progress",
    copy: "Monitor results and stay on track using our online customer portal.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      aria-label="Treatment plan features"
      className="w-full bg-white py-5"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-[60px]">
        <div className="overflow-hidden rounded-[24px] bg-[#142e2a] px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] lg:gap-12">
            {/* Left — heading + lede + CTA */}
            <Reveal as="div" className="flex flex-col">
              <h2 className="font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-white md:text-[44px]">
                A treatment plan that{" "}
                <em className="font-serif font-normal italic">works</em> around
                you
              </h2>
              <p className="mt-4 max-w-[36ch] font-ui text-[15px] leading-[22px] text-white/75 md:text-[16px]">
                Safe, clinically approved treatment delivered privately, so you
                can plan with confidence.
              </p>
              <div className="mt-7">
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 bg-white/5 px-7 font-ui text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-white/15"
                >
                  Choose your treatment
                </Link>
              </div>
            </Reveal>

            {/* Right — 2×3 feature grid */}
            <Reveal
              as="div"
              delay={120}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-3 rounded-[16px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <Image
                    src={f.icon}
                    alt=""
                    width={32}
                    height={32}
                    aria-hidden
                    className="h-8 w-8 [filter:brightness(0)_invert(1)]"
                  />
                  <h3 className="font-ui text-[17px] font-semibold leading-[22px] text-white">
                    {f.title}
                  </h3>
                  <p className="font-ui text-[13.5px] leading-[19px] text-white/65">
                    {f.copy}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
