import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import JourneyDivider from "@/components/home/JourneyDivider";

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

const CHIPS: Array<{ label: string; side: "left" | "right"; y: number }> = [
  { label: "Medication", side: "left",  y: 10 },
  { label: "Support",    side: "left",  y: 45 },
  { label: "Result",     side: "left",  y: 80 },
  { label: "Delivery",   side: "right", y: 10 },
  { label: "Guidance",   side: "right", y: 45 },
  { label: "Whatsapp",   side: "right", y: 80 },
];

function TimelineBlock() {
  return (
    <div className="flex flex-col items-center gap-8 md:items-start md:gap-10">
      <div className="flex flex-col items-center gap-4 text-center md:items-start md:gap-5 md:text-left">
        <span className="inline-flex items-center rounded-full border border-dashed border-white/60 px-5 py-1.5 font-ui text-[13px] font-medium tracking-[-0.02em] text-white">
          Timeline
        </span>
        <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-white md:text-[48px] md:leading-[52px]">
          What to expect in{" "}
          <em className="font-serif italic font-normal">your journey</em>
        </h2>
      </div>

      <div className="w-full">
        {/* Desktop rail */}
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
              <div
                key={s.pill}
                className="flex flex-col items-start gap-3 text-left"
              >
                <span className="inline-flex items-center rounded-full border border-dashed border-white/60 px-4 py-1.5 font-ui text-[12px] font-medium tracking-[-0.02em] text-white">
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

        {/* Mobile vertical list */}
        <ul className="flex flex-col gap-6 md:hidden">
          {STAGES.map((s) => (
            <li key={s.pill} className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center rounded-full border border-dashed border-white/60 px-4 py-1.5 font-ui text-[12px] font-medium tracking-[-0.02em] text-white">
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
      className="relative w-full bg-white pb-12 md:pb-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-20">
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
              <TimelineBlock />
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
