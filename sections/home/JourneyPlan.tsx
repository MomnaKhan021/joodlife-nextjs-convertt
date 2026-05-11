import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import JourneyDivider from "@/components/home/JourneyDivider";
import TimelineStages from "@/components/home/TimelineStages";

/**
 * Journey + Transformation — Figma Component 94.
 *
 * Layout: two clearly separated zones (dark green on top, lighter green
 * on the bottom) connected by a wavy divider with 11 dots that light up
 * one-by-one as the section scrolls into view.
 *
 *  ┌─────────────────────────────────┐
 *  │ #142e2a (dark green)            │
 *  │   [Timeline pill]               │
 *  │   What to expect in your journey│
 *  │   Today    1-6 Months   6-12    │
 *  │   • — — — • — — — — — • — — •   │
 *  │     [Hero portrait overlapping  │
 *  │      the wavy divider]          │
 *  │  ╭─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╮   │
 *  │  │ #87AF73 (lighter green)  │   │
 *  │  │  [Transformation card]   │   │
 *  │  │  [Expert Guidance card]  │   │
 *  │  └───────────────────────────┘  │
 *  └─────────────────────────────────┘
 */

const CHIPS: Array<{ label: string; side: "left" | "right"; y: number }> = [
  { label: "Medication", side: "left",  y: 10 },
  { label: "Support",    side: "left",  y: 45 },
  { label: "Result",     side: "left",  y: 80 },
  { label: "Delivery",   side: "right", y: 10 },
  { label: "Guidance",   side: "right", y: 45 },
  { label: "Whatsapp",   side: "right", y: 80 },
];

function TransformationCard() {
  return (
    <div className="relative flex flex-col gap-5 rounded-[24px] border border-white/20 bg-black/20 p-6 backdrop-blur-md md:p-8">
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[30px] md:leading-[36px]">
        It&rsquo;s more than treatment,
        <br />
        <em className="font-serif italic font-normal text-[#b4ff9f]">
          it&rsquo;s transformation
        </em>
      </h3>

      <div className="relative mx-auto h-[360px] w-full max-w-[460px] md:h-[420px]">
        {/* Connector lines from chip position to centre photo */}
        <svg
          aria-hidden
          viewBox="0 0 460 420"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {CHIPS.map((c, i) => {
            const yPct = c.y / 100;
            const y = yPct * 420;
            const startX = c.side === "left" ? 70 : 390;
            const endX = 230;
            const endY = 210;
            return (
              <line
                key={i}
                x1={startX}
                y1={y}
                x2={endX}
                y2={endY}
                stroke="#ffffff"
                strokeOpacity={0.25}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            );
          })}
        </svg>

        {/* Central photo */}
        <div className="absolute left-1/2 top-1/2 z-10 h-[280px] w-[170px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl md:h-[320px] md:w-[200px]">
          <Image
            src="/assets/figma/journey-transformation-photo.png"
            alt="Personalised plan patient"
            fill
            sizes="(max-width: 768px) 170px, 200px"
            className="object-cover"
          />
        </div>

        {/* Orbit chips */}
        {CHIPS.map((c) => (
          <span
            key={c.label}
            className={`absolute z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.35)] md:text-[12px]`}
            style={{
              top: `${c.y}%`,
              ...(c.side === "left"
                ? { left: "0%" }
                : { right: "0%" }),
              transform: "translateY(-50%)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#b4ff9f]" />
            {c.label}
          </span>
        ))}
      </div>

      <p className="mx-auto max-w-[360px] text-center font-ui text-[14px] font-medium leading-[20px] text-white/85 md:text-[15px] md:leading-[22px]">
        A provider licensed in your state will review your information, so that
        they can design a plan around your body&rsquo;s needs.
      </p>

      <a
        href="#get-personalized"
        className="mx-auto inline-flex h-[50px] w-full max-w-[292px] items-center justify-center rounded-lg border border-white/90 bg-white/[0.063] font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white backdrop-blur-[10px] transition-colors hover:bg-white/15"
      >
        Get personalised plan
      </a>
    </div>
  );
}

function ExpertGuidanceCard() {
  return (
    <div className="relative flex flex-col gap-5 rounded-[24px] border border-white/20 bg-black/20 p-6 backdrop-blur-md md:p-8">
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[30px] md:leading-[36px]">
        Continuous, Expert Guidance
      </h3>

      <div className="relative mx-auto flex h-[360px] w-full max-w-[460px] items-center justify-center md:h-[420px]">
        {/* Left vertical label */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] md:left-2">
          <span className="inline-block rotate-180 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 md:text-[12px]">
            <span className="mr-2 text-white">Monthly Check-in</span>
            <span>Free Consultation Every Month</span>
          </span>
        </div>

        {/* Central phone mockup */}
        <div className="relative h-full w-[220px] overflow-hidden rounded-2xl md:w-[280px]">
          <Image
            src="/assets/figma/journey-expert-phone.png"
            alt="Treatment check-in dashboard"
            fill
            sizes="(max-width: 768px) 220px, 280px"
            className="object-contain"
          />
        </div>

        {/* Right vertical label */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] md:right-2">
          <span className="inline-block font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-white md:text-[12px]">
            Health Assessment
          </span>
        </div>
      </div>

      <p className="text-center">
        <em className="font-serif text-[26px] italic leading-[32px] text-[#b4ff9f] md:text-[30px] md:leading-[36px]">
          at Every Step
        </em>
      </p>

      <p className="mx-auto max-w-[380px] text-center font-ui text-[14px] font-medium leading-[20px] text-white/85 md:text-[15px] md:leading-[22px]">
        Get access to qualified medical professionals who are here to support
        you throughout your journey whenever you need advice.
      </p>

      <a
        href="#get-started"
        className="mx-auto inline-flex h-[50px] w-[200px] items-center justify-center rounded-lg border border-white/90 bg-white/[0.063] font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white backdrop-blur-[10px] transition-colors hover:bg-white/15"
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
      className="relative w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-10 lg:px-[60px]">
        <div className="relative overflow-hidden rounded-[20px] md:rounded-3xl">
          {/* DARK zone (contains timeline) */}
          <div className="relative bg-[#142e2a] px-5 pt-12 pb-24 md:px-20 md:pt-[100px] md:pb-[180px]">
            {/* faint dot pattern */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #dff49f 1.5px, transparent 1.5px)",
                backgroundSize: "120px 120px",
              }}
            />

            <Reveal as="div" className="relative z-10">
              <TimelineStages />
            </Reveal>
          </div>

          {/* CURVE DIVIDER — full-width with animated dots */}
          <JourneyDivider />

          {/* LIGHT zone (contains hero photo overlapping divider + two cards) */}
          <div className="relative bg-[#87af73] px-5 pt-0 pb-12 md:px-20 md:pb-[100px]">
            {/* Hero portrait straddles the divider above */}
            <div className="relative -mt-[160px] mb-10 flex justify-center md:-mt-[280px] md:mb-16">
              <Image
                src="/assets/figma/journey-woman-desktop.png"
                alt="Smiling customer"
                width={560}
                height={447}
                className="h-auto w-[280px] md:w-[520px]"
                priority={false}
              />
            </div>

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
      </div>
    </section>
  );
}
