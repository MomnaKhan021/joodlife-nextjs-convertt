import Image from "next/image";

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

const PLAN_TILES = [
  { label: "Mounjaro Injection", hasImage: true },
  { label: "Protein", value: "110-130g\n/day" },
  { label: "Movement", value: "5x\n/week" },
  { label: "Sleep", value: "7-8hrs/\nnight" },
];

const PROFILE_TILES = [
  { label: "Name", value: "Sienna" },
  { label: "Age", value: "32" },
  { label: "Weight", value: "155lbs" },
  { label: "Goal", value: "140lbs" },
  { label: "History", value: "Anxiety\nPCOS" },
];

export default function JourneyPlan() {
  return (
    <section
      aria-label="Journey and personalized plan"
      className="relative w-full bg-white pb-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#142e2a] px-6 py-16 md:px-20 md:py-[100px]">
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

          {/* Timeline Block */}
          <div className="relative z-10 flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <span className="inline-flex items-center rounded-full bg-white/30 px-4 py-2 font-ui text-[14px] text-white">
                Timeline
              </span>
              <h2 className="font-display text-[36px] leading-[44px] font-semibold text-white md:text-[48px] md:leading-[56px]">
                What to expect in <br className="hidden md:block" />
                <em className="font-serif italic font-normal">your journey</em>
              </h2>
            </div>

            <div className="w-full max-w-[1200px]">
              {/* Timeline indicator row */}
              <div className="mb-6 hidden h-[2px] w-full bg-white/20 md:block" />

              <div className="grid gap-8 md:grid-cols-3">
                {STAGES.map((stage) => (
                  <div
                    key={stage.pill}
                    className="flex flex-col gap-4 border-l border-white/10 pl-0 md:border-l md:pl-8 md:first:border-l-0 md:first:pl-0"
                  >
                    <span className="inline-flex w-fit items-center rounded-3xl bg-white/10 px-4 py-2 font-ui text-[14px] text-white">
                      {stage.pill}
                    </span>
                    <h3 className="font-ui text-[22px] font-extrabold leading-[26px] text-white md:text-[25px]">
                      {stage.title}
                    </h3>
                    <p className="font-ui text-[16px] leading-[20px] text-white/90 md:text-[16.3px]">
                      {stage.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two overlay cards */}
          <div className="relative z-10 mt-[120px] grid gap-5 md:mt-[450px] md:grid-cols-2">
            {/* Card 1: Personalized Plan */}
            <div className="relative flex flex-col gap-4 rounded-3xl bg-black/10 px-6 py-8 backdrop-blur-sm md:px-6 md:py-8">
              <h3 className="text-center font-display text-[28px] leading-[36px] font-semibold text-white md:text-[34px] md:leading-[42px]">
                It&rsquo;s more than treatment,
              </h3>

              {/* Before/After mini with stats */}
              <div className="flex gap-3">
                <div className="relative h-[325px] flex-1 overflow-hidden rounded-2xl">
                  <Image
                    src="/assets/figma/before-3.png"
                    alt="Before"
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    className="object-cover"
                  />
                  <span className="absolute right-2 top-2 rounded-[2px] bg-white px-2 py-1 font-outfit text-[12px] font-normal text-[#142e2a]">
                    Before
                  </span>
                </div>
                <div className="relative h-[325px] flex-1 overflow-hidden rounded-2xl">
                  <Image
                    src="/assets/figma/after-bg.png"
                    alt="After"
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    className="object-cover"
                  />
                  <span className="absolute right-2 bottom-2 rounded-[2px] bg-[#142e2a] px-2 py-1 font-outfit text-[12px] font-normal text-white">
                    After
                  </span>
                </div>

                {/* Stat tiles */}
                <div className="flex w-[108px] shrink-0 flex-col gap-2">
                  <div className="flex flex-col items-center gap-1 rounded-md bg-[#142e2a] p-2">
                    <div className="relative h-[80px] w-full">
                      <Image
                        src="/assets/figma/mounjaro-hero.png"
                        alt="Mounjaro"
                        fill
                        sizes="108px"
                        className="object-contain"
                      />
                    </div>
                    <span className="font-ui text-[12px] text-white">
                      Mounjaro Injection
                    </span>
                  </div>
                  {PLAN_TILES.slice(1).map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between rounded-md bg-[#142e2a] p-2"
                    >
                      <span className="font-ui text-[12px] text-white">
                        {t.label}
                      </span>
                      <span className="whitespace-pre-line text-right font-ui text-[12px] text-[#dff49f]">
                        {t.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 pt-4 text-center">
                <p className="font-serif text-[28px] italic leading-[34px] text-[#b4ff9f] md:text-[34px] md:leading-[42px]">
                  it&rsquo;s transformation
                </p>
                <p className="font-ui text-[15px] leading-[22px] text-white md:text-[16.3px]">
                  A provider licensed in your state will review your information,
                  so that they can design a plan around your body&rsquo;s needs.
                </p>
                <a
                  href="#get-personalized"
                  className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white/10 px-12 font-ui text-[16.3px] font-semibold text-white transition hover:bg-white/20"
                >
                  Get Personalized Plan
                </a>
              </div>
            </div>

            {/* Card 2: Continuous Expert Guidance */}
            <div className="relative flex flex-col gap-4 rounded-3xl bg-black/10 px-6 py-8 backdrop-blur-sm md:px-6 md:py-8">
              <h3 className="text-center font-display text-[28px] leading-[36px] font-semibold text-white md:text-[34px] md:leading-[42px]">
                Continuous, Expert Guidance
              </h3>
              <div className="relative h-[325px] w-full overflow-hidden rounded-2xl">
                <Image
                  src="/assets/figma/expert-guidance.png"
                  alt="Expert guidance"
                  fill
                  sizes="(max-width: 768px) 100vw, 462px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col items-center gap-3 pt-4 text-center">
                <p className="font-serif text-[28px] italic leading-[34px] text-[#b4ff9f] md:text-[34px] md:leading-[42px]">
                  at Every Step
                </p>
                <p className="font-ui text-[15px] leading-[22px] text-white md:text-[16.3px]">
                  Get access to qualified medical professionals who are here to
                  support you throughout your journey whenever you need advice.
                </p>
                <a
                  href="#get-started"
                  className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white/10 px-12 font-ui text-[16.3px] font-semibold text-white transition hover:bg-white/20"
                >
                  Get started
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
