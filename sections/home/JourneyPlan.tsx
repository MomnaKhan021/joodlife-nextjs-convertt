import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Journey + Transformation — Figma Component 94.
 *
 * Three stacked blocks inside a dark-green rounded container:
 *  1. "Timeline" pill + "What to expect in your journey" heading
 *     with a 3-step dashed timeline (Today → 1-6 Months → 6-12 Months)
 *  2. A photo of a happy customer over a green wave backdrop
 *  3. Two feature cards side-by-side (stacked on mobile):
 *     - "It's more than treatment, it's transformation"
 *     - "Continuous, Expert Guidance at Every Step"
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

const MOBILE_STAGES = [
  {
    pill: "Today",
    title: "Simple assessment",
    copy: "Quick online consultation with prescription and delivery if eligible through Jood.",
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

function TimelineBlock() {
  return (
    <div className="flex flex-col items-center gap-8 md:items-start md:gap-10">
      <div className="flex flex-col items-center gap-4 text-center md:items-start md:gap-5 md:text-left">
        <span className="inline-flex items-center rounded-full border border-dashed border-white/50 bg-transparent px-5 py-1.5 font-ui text-[14px] font-medium tracking-[-0.02em] text-white">
          Timeline
        </span>
        <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-white md:text-[48px] md:leading-[52px]">
          What to expect in{" "}
          <span className="md:whitespace-nowrap">
            <em className="font-serif italic font-normal">your journey</em>
          </span>
        </h2>
      </div>

      {/* 3-step timeline — desktop uses a horizontal dashed rail, mobile uses vertical pills */}
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
                data-position={i === 0 ? "start" : i === 2 ? "end" : "mid"}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-8">
            {STAGES.map((s) => (
              <div
                key={s.pill}
                className="flex flex-col items-start gap-3 text-left"
              >
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

        {/* Mobile: stacked vertical timeline with pills on the left */}
        <ul className="flex flex-col gap-6 md:hidden">
          {MOBILE_STAGES.map((s) => (
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

function TransformationCard() {
  return (
    <div className="flex flex-col gap-5 rounded-[20px] bg-black/20 p-6 backdrop-blur-sm md:p-8">
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[32px] md:leading-[38px]">
        It&rsquo;s more than treatment,{" "}
        <em className="block font-serif italic font-normal text-[#b4ff9f]">
          it&rsquo;s transformation
        </em>
      </h3>

      <div className="relative mx-auto aspect-[1/1] w-full max-w-[360px] overflow-hidden rounded-2xl">
        <Image
          src="/assets/figma/before-3.png"
          alt="Personalised plan illustration"
          fill
          sizes="(max-width: 768px) 90vw, 360px"
          className="object-cover"
        />

        {/* Chip labels around the photo */}
        <span className="absolute left-3 top-3 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
          Medication
        </span>
        <span className="absolute left-3 top-1/3 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
          Support
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
          Result
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
          Delivery
        </span>
        <span className="absolute right-3 top-1/3 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
          Guidance
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
          Whatsapp
        </span>
      </div>

      <p className="text-center font-ui text-[14px] font-medium leading-[20px] text-white/80 md:text-[15px]">
        A provider licensed in your state will review your information, so that
        they can design a plan around your body&rsquo;s needs.
      </p>

      <a
        href="#get-personalized"
        className="mx-auto inline-flex h-[50px] w-full max-w-[300px] items-center justify-center rounded-lg bg-white/15 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
      >
        Get personalised plan
      </a>
    </div>
  );
}

function ExpertGuidanceCard() {
  return (
    <div className="flex flex-col gap-5 rounded-[20px] bg-black/20 p-6 backdrop-blur-sm md:p-8">
      <h3 className="text-center font-display text-[26px] font-semibold leading-[32px] tracking-[-0.02em] text-white md:text-[32px] md:leading-[38px]">
        Continuous, Expert Guidance
      </h3>

      <div className="relative mx-auto aspect-[1/1] w-full max-w-[360px] overflow-hidden rounded-2xl bg-[#f7f9f2]">
        <Image
          src="/assets/figma/expert-guidance.png"
          alt="Expert guidance illustration"
          fill
          sizes="(max-width: 768px) 90vw, 360px"
          className="object-cover"
        />
      </div>

      <p className="text-center">
        <em className="font-serif text-[26px] italic leading-[32px] text-[#b4ff9f] md:text-[32px] md:leading-[38px]">
          at Every Step
        </em>
      </p>

      <p className="text-center font-ui text-[14px] font-medium leading-[20px] text-white/80 md:text-[15px]">
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
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, #dff49f 1.5px, transparent 1.5px)",
              backgroundSize: "120px 120px",
            }}
          />

          <Reveal as="div" className="relative z-10">
            <TimelineBlock />
          </Reveal>

          <Reveal
            as="div"
            delay={150}
            className="relative z-10 mt-12 grid gap-5 md:mt-16 md:grid-cols-2"
          >
            <TransformationCard />
            <ExpertGuidanceCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
