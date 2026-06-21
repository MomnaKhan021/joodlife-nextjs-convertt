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

/**
 * Chip data — each chip has a 36–40px white circle on the left
 * holding an inline-SVG icon, then a bold label + a smaller subtitle
 * stacked on the right. Order matches Figma 141:2349:
 *   Left column (top → bottom):  Medication / Support / Result
 *   Right column (top → bottom): Delivery / Guidance / Whatapp
 */
type ChipDef = {
  label: string;
  sub: string;
  side: "left" | "right";
  icon: React.ReactNode;
};

function PillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.5 3.5l-7 7a3 3 0 0 0 4.243 4.243l7-7a3 3 0 1 0-4.243-4.243z"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 7l4.243 4.243"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 13l5 5a3 3 0 0 1-4.243 4.243l-5-5"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResultIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 17l6-6 4 4 8-8"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7h7v7"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 9.4 7.5 4.21M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GuidanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#142e2a" strokeWidth="1.4" />
      <text
        x="12"
        y="14"
        textAnchor="middle"
        fontSize="6"
        fontWeight="800"
        fill="#142e2a"
        fontFamily="Arial, sans-serif"
      >
        24/7
      </text>
    </svg>
  );
}

const CHIPS: ChipDef[] = [
  { label: "Medication", sub: "Name",              side: "left",  icon: <PillIcon /> },
  { label: "Support",    sub: "On going",          side: "left",  icon: <SupportIcon /> },
  { label: "Result",     sub: "Loss upto 26 %",    side: "left",  icon: <ResultIcon /> },
  { label: "Delivery",   sub: "Next Day",          side: "right", icon: <DeliveryIcon /> },
  { label: "Guidance",   sub: "For lasting result",side: "right", icon: <GuidanceIcon /> },
  { label: "Whatapp",    sub: "24/7 support",      side: "right", icon: <WhatappIcon /> },
];

function Chip({ chip }: { chip: ChipDef }) {
  return (
    <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-[#0c2421]/85 px-3 py-2 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.55)] backdrop-blur-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
        {chip.icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-ui text-[18px] font-bold leading-[22px] tracking-[-0.02em] text-[#dff49f]">
          {chip.label}
        </span>
        <span className="font-ui text-[12px] font-normal leading-[16px] tracking-[-0.01em] text-white/85">
          {chip.sub}
        </span>
      </div>
    </div>
  );
}

export function TransformationCard() {
  return (
    <div className="relative flex h-full flex-col gap-6 rounded-[24px] bg-[#0a1f1c]/55 p-6 backdrop-blur-md md:p-8">
      {/* Heading */}
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[30px] md:leading-[36px]">
        It&rsquo;s more than treatment,
        <br />
        <em className="font-serif italic font-normal text-[#dff49f]">
          it&rsquo;s transformation
        </em>
      </h3>

      {/* Description with green highlight on second clause */}
      <p className="mx-auto max-w-[400px] text-center font-ui text-[14px] font-normal leading-[20px] tracking-[-0.01em] text-white/85 md:text-[15px] md:leading-[22px]">
        A provider licensed in your state will review your information, so
        that they can{" "}
        <span className="text-[#dff49f]">
          design a plan around your body&rsquo;s needs.
        </span>
      </p>

      {/* Chip layout with central photo
          Layout: photo is centred + bottom-aligned; chip columns are
          absolutely-positioned over it so the right column can
          overlap the photo just like the Figma render does.
          Right column sits slightly lower so the chips fan out
          diagonally instead of mirroring the left exactly. */}
      <div className="relative mx-auto h-[420px] w-full max-w-[540px] flex-1 md:h-[480px]">
        {/* Center photo */}
        <div className="absolute bottom-0 left-1/2 h-[340px] w-[180px] -translate-x-1/2 overflow-hidden md:h-[420px] md:w-[220px]">
          <Image
            src="/assets/figma/journey-transformation-photo.png"
            alt="Personalised plan patient"
            fill
            sizes="(max-width: 768px) 180px, 220px"
            quality={95}
            className="object-cover object-bottom"
          />
        </div>

        {/* Left column of chips */}
        <div className="absolute left-0 top-6 z-20 flex flex-col items-start gap-3 md:gap-4">
          {CHIPS.filter((c) => c.side === "left").map((c) => (
            <Chip key={c.label} chip={c} />
          ))}
        </div>

        {/* Right column of chips — starts further down so they fan
            out beside the figure */}
        <div className="absolute right-0 top-[120px] z-20 flex flex-col items-end gap-3 md:top-[140px] md:gap-4">
          {CHIPS.filter((c) => c.side === "right").map((c) => (
            <Chip key={c.label} chip={c} />
          ))}
        </div>
      </div>

      {/* CTA — translucent button matching Figma's GET PERSONALIZED PLAN */}
      <a
        href="#get-personalized"
        className="mx-auto mt-2 inline-flex h-[50px] w-full max-w-[292px] items-center justify-center rounded-lg border border-white/30 bg-black/20 font-ui text-[13px] font-semibold uppercase tracking-[0.05em] text-white backdrop-blur-md transition-colors duration-200 hover:bg-black/35"
      >
        Get personalized plan
      </a>
    </div>
  );
}

function ClockGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExpertGuidanceCard() {
  return (
    <div className="relative flex h-full flex-col gap-5 rounded-[24px] bg-[#0a1f1c]/55 p-6 backdrop-blur-md md:p-8">
      {/* Heading */}
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[30px] md:leading-[36px]">
        Continuous, Expert Guidance
      </h3>

      {/* Phone mockup centred between two vertical labels */}
      <div className="relative mx-auto flex h-[360px] w-full max-w-[460px] items-stretch justify-between gap-4 md:h-[420px]">
        {/* Left vertical label: clock + "Free Consultation Every Month" / "Monthly Check-in" */}
        <div className="flex flex-col items-center justify-center gap-3 pl-1 [writing-mode:vertical-rl] md:pl-2">
          <div className="rotate-180 inline-flex items-center gap-2 font-ui text-[11px] font-medium tracking-[0.06em] text-white/70 md:text-[12px]">
            <span className="text-white/70">
              <ClockGlyph />
            </span>
            Free Consultation Every Month
          </div>
          <span className="rotate-180 font-display text-[22px] font-semibold tracking-[-0.02em] text-white md:text-[24px]">
            Monthly Check-in
          </span>
        </div>

        {/* Central phone mockup */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative h-full w-full max-w-[260px] overflow-visible">
            {/* Phone frame */}
            <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#e5e6e3] p-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]">
              {/* Treatment Check-in pill at top */}
              <div className="mb-2 flex items-center justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-ui text-[12px] font-semibold text-[#142e2a] shadow-sm md:text-[13px]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#142e2a] text-white">
                    <PhoneGlyph />
                  </span>
                  Treatment Check-in
                </span>
              </div>
              {/* Doctor photo */}
              <div className="relative h-[calc(100%-44px)] w-full overflow-hidden rounded-[18px]">
                <Image
                  src="/assets/figma/journey-expert-phone.png"
                  alt="Treatment check-in dashboard"
                  fill
                  sizes="(max-width: 768px) 220px, 260px"
                  quality={95}
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right vertical label: HEALTH ASSESSMENT */}
        <div className="flex items-center justify-center pr-1 [writing-mode:vertical-rl] md:pr-2">
          <span className="font-ui text-[12px] font-semibold uppercase tracking-[0.18em] text-white md:text-[13px]">
            Health Assessment
          </span>
        </div>
      </div>

      {/* "at Every Step" italic accent */}
      <p className="text-center">
        <em className="font-serif text-[26px] italic leading-[32px] text-[#dff49f] md:text-[30px] md:leading-[36px]">
          at Every Step
        </em>
      </p>

      {/* Description — green highlight on "throughout your journey" */}
      <p className="mx-auto max-w-[400px] text-center font-ui text-[14px] font-normal leading-[20px] tracking-[-0.01em] text-white/85 md:text-[15px] md:leading-[22px]">
        Get access to qualified medical professionals who are here to support
        you{" "}
        <span className="text-[#dff49f]">throughout your journey</span> whenever
        you need advice.
      </p>

      <a
        href="#get-started"
        className="mx-auto mt-2 inline-flex h-[50px] w-[200px] items-center justify-center rounded-lg border border-white/30 bg-black/20 font-ui text-[13px] font-semibold uppercase tracking-[0.05em] text-white backdrop-blur-md transition-colors duration-200 hover:bg-black/35"
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

          {/* Lower zone — same dark green throughout per Figma. The
              wavy curve above is purely decorative; the colour does
              NOT change between top and bottom. */}
          <div className="relative bg-[#142e2a] px-5 pt-0 pb-12 md:px-20 md:pb-[80px]">
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

            {/* Card order: on desktop Transformation is on the left and
                Expert Guidance is on the right; on mobile the order is
                flipped so Expert Guidance appears first (per Figma
                mobile frame 141:1235). The CSS `order` utilities below
                handle the flip without duplicating markup. */}
            <Reveal
              as="div"
              delay={150}
              className="relative z-10 grid gap-5 md:grid-cols-2 md:gap-6"
            >
              <div className="order-2 md:order-1">
                <TransformationCard />
              </div>
              <div className="order-1 md:order-2">
                <ExpertGuidanceCard />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
