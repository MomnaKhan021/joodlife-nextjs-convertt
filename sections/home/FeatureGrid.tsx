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
    icon: "/assets/figma/feature-effective.svg",
    title: "Medication",
    copy: "Clinically appropriate treatment",
  },
  {
    icon: "/assets/figma/feature-support.svg",
    title: "Support",
    copy: "Ongoing clinician support",
  },
  {
    icon: "/assets/figma/feature-progress.svg",
    title: "Progress",
    copy: "Personalised care",
  },
  {
    icon: "/assets/figma/feature-delivery.svg",
    title: "Delivery",
    copy: "Free next-day delivery",
  },
  {
    icon: "/assets/figma/feature-consult.svg",
    title: "Guidance",
    copy: "Long-term support",
  },
  {
    icon: "/assets/figma/feature-support.svg",
    title: "WhatsApp",
    copy: "24/7 support",
  },
];

export default function FeatureGrid() {
  return (
    <section
      aria-label="Treatment plan features"
      className="w-full bg-[#142e2a] py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[476fr_804fr] lg:gap-10">
          {/* Left — heading + lede + CTA */}
          <Reveal as="div" className="flex flex-col">
            <h2 className="font-display text-[22px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[44px]">
              It&rsquo;s more than treatment, it&rsquo;s{" "}
              <em className="font-serif font-normal italic">transformation</em>
            </h2>
            <p className="mt-4 max-w-[34ch] font-ui text-[15px] leading-[22px] text-white/75 md:text-[16px]">
              Your clinician will review your health and create a personalised
              treatment plan tailored to your individual needs.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="btn-cta inline-flex h-12 items-center justify-center rounded-lg border border-white/40 bg-white/5 px-7 font-ui text-[14px] font-semibold text-white hover:bg-white/15"
              >
                Start Your Journey
              </Link>
              <Link
                href="/wegovy-pills"
                className="btn-cta inline-flex h-12 items-center justify-center rounded-lg bg-[#dff49f] px-7 font-ui text-[14px] font-semibold text-[#142e2a] hover:bg-[#cbe886]"
              >
                Discover Wegovy® Tablets
              </Link>
            </div>
          </Reveal>

          {/* Right — 2×3 feature grid (flush cards, subtle bg) */}
          <Reveal
            as="div"
            delay={120}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2.5 rounded-[12px] border border-white/10 bg-white/[0.05] p-4 md:p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 md:h-12 md:w-12">
                  <Image
                    src={f.icon}
                    alt=""
                    width={28}
                    height={28}
                    aria-hidden
                    className="h-6 w-6 md:h-7 md:w-7"
                  />
                </span>
                <h3 className="mt-1 font-ui text-[15px] font-semibold leading-[20px] text-white md:text-[17px] md:leading-[22px]">
                  {f.title}
                </h3>
                <p className="font-ui text-[12.5px] leading-[17px] text-white/65 md:text-[13.5px] md:leading-[19px]">
                  {f.copy}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
