import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

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
    desktopCopy: "Access experienced clinicians and coaches whenever you need.",
    mobileTitle: "Ongoing, Expert Support",
    mobileCopy: "Talk to experienced medical professionals whenever you need.",
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
    desktopCopy: "Monitor results and stay on track using our online customer portal.",
    mobileTitle: "Track Your Progress",
    mobileCopy: "We’re here for every step of the way.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      aria-label="Treatment plan features"
      className="w-full bg-[#142e2a] py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">

        {/* ── Desktop: 2-column layout — heading/CTA left, cards right ── */}
        <div className="hidden md:grid md:grid-cols-[380px_minmax(0,1fr)] md:gap-10 lg:gap-16 lg:grid-cols-[420px_minmax(0,1fr)]">
          {/* LEFT — heading + subtitle + CTA */}
          <Reveal as="div" className="flex flex-col justify-center gap-6 py-4">
            <h2 className="font-display text-[48px] font-semibold leading-[52px] tracking-[-0.02em] text-white">
              A treatment plan that{" "}
              <em className="font-serif italic font-normal">works</em> around you
            </h2>
            <p className="max-w-[320px] font-ui text-[16px] font-normal leading-[22px] text-white/75">
              Safe, clinically approved treatment delivered privately, so you can plan with confidence.
            </p>
            <a
              href="#get-started"
              className="inline-flex h-[50px] w-fit items-center justify-center rounded-lg border border-white/40 bg-transparent px-8 font-ui text-[16.3px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Choose your treatment
            </a>
          </Reveal>

          {/* RIGHT — 2×3 cards grid */}
          <Reveal as="div" delay={100} className="grid grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.desktopTitle}
                className="flex flex-col gap-3 rounded-[16px] bg-white/8 px-4 py-5 backdrop-blur-sm"
              >
                <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-lg bg-white/10">
                  <Image
                    src={f.icon}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 brightness-0 invert"
                    aria-hidden
                  />
                </div>
                <h3 className="font-ui text-[15px] font-semibold leading-[20px] tracking-[-0.02em] text-white">
                  {f.desktopTitle}
                </h3>
                <p className="font-ui text-[13px] font-normal leading-[17px] text-white/70">
                  {f.desktopCopy}
                </p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* ── Mobile: heading + single card list ── */}
        <div className="md:hidden">
          <Reveal as="div" className="pb-8 text-center">
            <h2 className="font-display text-[32px] font-semibold leading-[36px] tracking-[-0.03em] text-white">
              Everything you need for{" "}
              <em className="font-serif italic font-normal">lasting</em> results
            </h2>
          </Reveal>

          <Reveal as="div" delay={100} className="rounded-[20px] bg-white/8 px-5 py-6">
            <ul className="flex flex-col">
              {FEATURES.map((f, i) => (
                <li
                  key={f.mobileTitle}
                  className={`flex items-start gap-4 py-5 ${i === 0 ? "pt-0" : ""} ${
                    i < FEATURES.length - 1 ? "border-b border-dashed border-white/20" : "pb-0"
                  }`}
                >
                  <div className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-lg bg-white/10">
                    <Image
                      src={f.icon}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 brightness-0 invert"
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

          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href="#get-started"
              className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-white font-ui text-[16.3px] font-semibold text-[#142e2a] transition-colors hover:bg-white/90"
            >
              Get started
            </a>
            <a
              href="#eligible"
              className="inline-flex h-[50px] w-full items-center justify-center rounded-lg border border-white/40 bg-transparent font-ui text-[16.3px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              See if you are eligible
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
