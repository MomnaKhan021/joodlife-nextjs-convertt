import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "A treatment plan / Everything you need" — Figma Component 288 (desktop)
 * + Container 107:2320 (mobile).
 *
 * Desktop: 6 equal cards in a row, each 203×262 with #f7f9f2 bg, radius
 * ~16.6, icon + title + small description stacked, followed by two
 * primary/secondary buttons.
 *
 * Mobile: single #f7f9f2 card containing 6 stacked rows (icon on left,
 * title + description on right), separated by dashed dividers.
 * Heading changes copy on mobile per Figma ("Everything you need for
 * lasting results").
 */

type Feature = {
  icon: string;
  desktopTitle: string;
  desktopCopy: string;
  mobileTitle: string;
  mobileCopy: string;
};

const FEATURES: Feature[] = [
  {
    icon: "/assets/figma/feature-delivery.svg",
    desktopTitle: "Discreet, next-day delivery",
    desktopCopy: "Next-day, unbranded, secure delivery with DPD",
    mobileTitle: "Discreet, Free Delivery",
    mobileCopy: "No names, no branding, and free fast delivery.",
  },
  {
    icon: "/assets/figma/feature-support.svg",
    desktopTitle: "24/7 expert support",
    desktopCopy:
      "Access experienced clinicians and coaches whenever you need.",
    mobileTitle: "Ongoing, Expert Support",
    mobileCopy:
      "Talk to experienced medical professionals whenever you need.",
  },
  {
    icon: "/assets/figma/feature-trusted.svg",
    desktopTitle: "Trusted by thousands",
    desktopCopy: "Chosen by patients nationwide for safe, effective care.",
    mobileTitle: "Highly Trusted by Customers",
    mobileCopy: "Trusted by over 1k+ happy customers.",
  },
  {
    icon: "/assets/figma/feature-effective.svg",
    desktopTitle: "Highly effective treatments",
    desktopCopy: "Modern, evidence-based medication options.",
    mobileTitle: "Highly Effective Treatments",
    mobileCopy: "Modern treatments, backed by clinical research.",
  },
  {
    icon: "/assets/figma/feature-consult.svg",
    desktopTitle: "Quick, easy consultation",
    desktopCopy: "Start online in minutes; simple, private, seamless.",
    mobileTitle: "Quick, Easy Consultation",
    mobileCopy: "Get started today with an easy consultation.",
  },
  {
    icon: "/assets/figma/feature-progress.svg",
    desktopTitle: "Track your progress",
    desktopCopy:
      "Monitor results and stay on track using our online customer portal.",
    mobileTitle: "Track Your Progress",
    mobileCopy: "We\u2019re here for every step of the way.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      aria-label="Treatment plan features"
      className="w-full bg-white py-12 md:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        {/* Heading — different copy on desktop vs mobile, per Figma */}
        <Reveal as="div" className="pb-10 text-center md:pb-12">
          <h2 className="mx-auto hidden max-w-[720px] font-display text-[48px] font-semibold leading-[52px] tracking-[-0.02em] text-[#142e2a] md:block">
            A treatment plan that{" "}
            <em className="font-serif italic font-normal">works</em> with your
            body
          </h2>
          <h2 className="font-display text-[32px] font-semibold leading-[36px] tracking-[-0.03em] text-[#142e2a] md:hidden">
            Everything you need for{" "}
            <em className="font-serif italic font-normal">lasting</em> results
          </h2>
        </Reveal>

        {/* Desktop: 6 cards in a row */}
        <Reveal
          as="div"
          delay={100}
          className="hidden md:grid md:grid-cols-6 md:gap-5"
        >
          {FEATURES.map((f) => (
            <div
              key={f.desktopTitle}
              className="flex h-[262px] flex-col items-center gap-3 rounded-[16.6px] bg-[#f7f9f2] px-3 py-6 text-center"
            >
              <div className="grid h-[110px] w-[110px] shrink-0 place-items-center">
                <Image
                  src={f.icon}
                  alt=""
                  width={68}
                  height={68}
                  className="h-[68px] w-[68px]"
                  aria-hidden
                />
              </div>
              <h3 className="font-ui text-[22px] font-bold leading-[26px] tracking-[-0.02em] text-[#142e2a]">
                {f.desktopTitle}
              </h3>
              <p className="font-ui text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-[#142e2a]">
                {f.desktopCopy}
              </p>
            </div>
          ))}
        </Reveal>

        {/* Mobile: single card, 6 stacked rows with dashed dividers */}
        <Reveal
          as="div"
          delay={100}
          className="rounded-[20px] bg-[#f7f9f2] px-5 py-6 md:hidden"
        >
          <ul className="flex flex-col">
            {FEATURES.map((f, i) => (
              <li
                key={f.mobileTitle}
                className={`flex items-start gap-4 py-5 ${
                  i === 0 ? "pt-0" : ""
                } ${
                  i < FEATURES.length - 1
                    ? "border-b border-dashed border-[#142e2a]/20"
                    : "pb-0"
                }`}
              >
                <div className="grid h-[50px] w-[50px] shrink-0 place-items-center">
                  <Image
                    src={f.icon}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-ui text-[16.3px] font-bold leading-[20px] tracking-[-0.02em] text-[#142e2a]">
                    {f.mobileTitle}
                  </h3>
                  <p className="font-ui text-[16.3px] font-medium leading-[20px] tracking-[-0.02em] text-[#142e2a]/75">
                    {f.mobileCopy}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* CTAs — stacked on mobile (primary dark, secondary outlined),
           side-by-side on desktop with Figma widths 200×50 / 279×50 */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 md:mt-10 md:flex-row md:gap-4">
          <a
            href="#get-started"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] md:w-[200px]"
          >
            Get started
          </a>
          <a
            href="#eligible"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-lg border border-[#142e2a]/25 bg-white font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-[#142f2b] transition-colors hover:bg-[#f7f9f2] md:w-[279px]"
          >
            See if you are eligible
          </a>
        </div>
      </div>
    </section>
  );
}
