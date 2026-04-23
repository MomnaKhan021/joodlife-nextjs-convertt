import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Journey + Transformation — Figma Component 94.
 *
 * Three stacked blocks inside a dark-green rounded container:
 *  1. "Timeline" pill + "What to expect in your journey" heading
 *     with a 3-step dashed timeline
 *  2. A hero photo of a smiling customer (pulled from the Figma
 *     asset library at 3× resolution)
 *  3. Two feature cards side-by-side (stacked on mobile):
 *     - "It's more than treatment, it's transformation" — central
 *       photo with orbit-style chip labels (Medication, Support,
 *       Result, Delivery, Guidance, Whatsapp)
 *     - "Continuous, Expert Guidance" — phone mockup with health
 *       check-in panels, "at Every Step" accent, Get started button
 */

const STAGES = [
  {
    pill: "Today",
    title: "Simple assessment",
    copy: "Quick online consultation with prescription and delivery if eligible.",
  },
  {
    pill: "1 - 6 Months",
    title: "Healthy weight loss",
    copy: "Steady weight loss with ongoing clinical support.",
  },
  {
    pill: "6 - 12 Months",
    title: "Lasting change",
    copy: "Maintain results with continued guidance and care.",
  },
];

const CHIPS = [
  { label: "Medication", side: "left",  y: "8%"  },
  { label: "Support",    side: "left",  y: "42%" },
  { label: "Result",     side: "left",  y: "80%" },
  { label: "Delivery",   side: "right", y: "8%"  },
  { label: "Guidance",   side: "right", y: "42%" },
  { label: "Whatsapp",   side: "right", y: "80%" },
];

function TimelineBlock() {
  return (
    <div className="flex flex-col items-center gap-8 md:items-start md:gap-10">
      <div className="flex flex-col items-center gap-4 text-center md:items-start md:gap-5 md:text-left">
        <span className="inline-flex items-center rounded-full border border-dashed border-white/50 bg-transparent px-5 py-1.5 font-ui text-[14px] font-medium tracking-[-0.02em] text-white">
          Timeline
        </span>
        <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-white md:text-[48px] md:leading-[52px]">
          What to expect in{" "}
          <em className="font-serif italic font-normal">your journey</em>
        </h2>
      </div>

      <div className="w-full">
        {/* Desktop: dashed rail with 3 columns */}
        <div className="hidden md:block">
          <div
            aria-hidden
            className="relative mb-8 h-[2px] w-full"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.4) 50%, transparent 50%)",
              backgroundSize: "12px 2px",
              backgroundRepeat: "repeat-x",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#dff49f]"
                style={{ left: `calc(${(i * 100) / 2}% - 6px)` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-8">
            {STAGES.map((s) => (
              <div key={s.pill} className="flex flex-col items-start gap-3 text-left">
                <span className="inline-flex items-center rounded-full border border-dashed border-white/50 px-4 py-1.5 font-ui text-[13px] font-medium tracking-[-0.02em] text-white">
                  {s.pill}
                </span>
                <h3 className="font-ui text-[22px] font-bold leading-[26px] tracking-[-0.02em] text-white">
                  {s.title}
                </h3>
                <p className="max-w-[300px] font-ui text-[14px] font-medium leading-[20px] tracking-[-0.02em] text-white/85">
                  {s.copy}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: stacked vertical timeline */}
        <ul className="flex flex-col gap-6 md:hidden">
          {STAGES.map((s) => (
            <li key={s.pill} className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center rounded-full border border-dashed border-white/50 px-4 py-1.5 font-ui text-[12px] font-medium tracking-[-0.02em] text-white">
                {s.pill}
              </span>
              <h3 className="font-ui text-[18px] font-bold leading-[22px] tracking-[-0.02em] text-white">
                {s.title}
              </h3>
              <p className="font-ui text-[14px] font-medium leading-[20px] tracking-[-0.02em] text-white/80">
                {s.copy}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HeroWomanPhoto() {
  return (
    <div className="relative mx-auto my-10 flex w-full max-w-[640px] items-end justify-center md:my-12">
      {/* Soft green wave behind the portrait */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-[220px] w-[140%] -translate-x-1/2 rounded-[50%] blur-3xl md:h-[320px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(100,136,92,0.85) 0%, rgba(100,136,92,0) 70%)",
        }}
      />
      <Image
        src="/assets/figma/journey-woman-desktop.png"
        alt="Smiling customer"
        width={520}
        height={415}
        className="relative z-10 h-auto w-[320px] md:w-[520px]"
        priority={false}
      />
    </div>
  );
}

function TransformationCard() {
  return (
    <div className="flex flex-col gap-5 rounded-[20px] bg-black/20 p-6 backdrop-blur-sm md:p-8">
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[30px] md:leading-[36px]">
        It&rsquo;s more than treatment,
        <br />
        <em className="font-serif italic font-normal text-[#b4ff9f]">
          it&rsquo;s transformation
        </em>
      </h3>

      <div className="relative mx-auto flex h-[320px] w-full max-w-[420px] items-center justify-center md:h-[380px]">
        {/* Center photo */}
        <div className="relative z-10 h-full w-[180px] overflow-hidden rounded-2xl md:w-[220px]">
          <Image
            src="/assets/figma/journey-transformation-photo.png"
            alt="Personalised plan patient"
            fill
            sizes="(max-width: 768px) 200px, 260px"
            className="object-cover"
          />
        </div>

        {/* Orbit chips — 3 on each side, vertically stacked */}
        {CHIPS.map((c) => (
          <span
            key={c.label}
            className={`absolute z-20 inline-flex items-center gap-1.5 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] md:text-[12px] ${
              c.side === "left" ? "left-0 md:left-2" : "right-0 md:right-2"
            }`}
            style={{ top: c.y }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#b4ff9f]" />
            {c.label}
          </span>
        ))}
      </div>

      <p className="mx-auto max-w-[360px] text-center font-ui text-[14px] font-medium leading-[20px] text-white/80 md:text-[15px] md:leading-[22px]">
        A provider licensed in your state will review your information, so that
        they can design a plan around your body&rsquo;s needs.
      </p>

      <a
        href="#get-personalized"
        className="mx-auto inline-flex h-[50px] w-full max-w-[280px] items-center justify-center rounded-lg bg-white/15 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
      >
        Get personalised plan
      </a>
    </div>
  );
}

function ExpertGuidanceCard() {
  return (
    <div className="flex flex-col gap-5 rounded-[20px] bg-black/20 p-6 backdrop-blur-sm md:p-8">
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[30px] md:leading-[36px]">
        Continuous, Expert Guidance
      </h3>

      <div className="relative mx-auto flex h-[320px] w-full max-w-[420px] items-center justify-center md:h-[380px]">
        <div className="relative h-full w-full overflow-hidden rounded-2xl">
          <Image
            src="/assets/figma/journey-expert-phone.png"
            alt="Treatment check-in dashboard"
            fill
            sizes="(max-width: 768px) 90vw, 420px"
            className="object-contain"
          />
        </div>
      </div>

      <p className="text-center">
        <em className="font-serif text-[26px] italic leading-[32px] text-[#b4ff9f] md:text-[30px] md:leading-[36px]">
          at Every Step
        </em>
      </p>

      <p className="mx-auto max-w-[380px] text-center font-ui text-[14px] font-medium leading-[20px] text-white/80 md:text-[15px] md:leading-[22px]">
        Get access to qualified medical professionals who are here to support
        you throughout your journey whenever you need advice.
      </p>

      <a
        href="#get-started"
        className="mx-auto inline-flex h-[50px] w-[200px] items-center justify-center rounded-lg bg-white font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-[#142f2b] transition-colors hover:bg-[#d3dabe]"
      >
        Get started
      </a>
    </div>
  );
}

export default function JourneyPlan() {
  return (
    <section
      aria-label="Journey and personalized plan"
      className="relative w-full bg-white pb-12 md:pb-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-20">
        <div className="relative overflow-hidden rounded-[20px] bg-[#142e2a] px-5 py-12 md:rounded-3xl md:px-20 md:py-[100px]">
          {/* Decorative dots */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle, #dff49f 1.5px, transparent 1.5px)",
              backgroundSize: "120px 120px",
            }}
          />

          <Reveal as="div" className="relative z-10">
            <TimelineBlock />
          </Reveal>

          <Reveal as="div" delay={100} className="relative z-10">
            <HeroWomanPhoto />
          </Reveal>

          <Reveal
            as="div"
            delay={150}
            className="relative z-10 grid gap-5 md:grid-cols-2 md:gap-6"
          >
            <TransformationCard />
            <ExpertGuidanceCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
