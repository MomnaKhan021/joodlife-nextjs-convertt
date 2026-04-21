import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

const FEATURES = [
  {
    icon: "/assets/icons/usp-delivery.svg",
    title: "Discreet, next-day delivery",
    copy: "Next-day, unbranded, secure delivery with DPD",
  },
  {
    icon: "/assets/icons/usp-support.svg",
    title: "24/7 expert support",
    copy: "Access experienced clinicians and coaches whenever you need.",
  },
  {
    icon: "/assets/figma/icon-trusted.svg",
    title: "Trusted by thousands",
    copy: "Chosen by patients nationwide for safe, effective care.",
  },
  {
    icon: "/assets/figma/icon-highly-effective.svg",
    title: "Highly effective treatments",
    copy: "Modern, evidence-based medication options.",
  },
  {
    icon: "/assets/figma/icon-easy-consult.svg",
    title: "Quick, easy consultation",
    copy: "Start online in minutes; simple, private, seamless.",
  },
  {
    icon: "/assets/figma/icon-track-progress.svg",
    title: "Track your progress",
    copy: "Monitor results and stay on track using our online customer portal.",
  },
];

const BOTTOM_TILES = [
  {
    title: "100%",
    copy: "Online program, express delivery without any hassle.",
    isBig: true,
  },
  {
    title: "Discreet, free delivery",
    icon: "/assets/icons/usp-delivery.svg",
  },
  {
    title: "Ongoing, expert support",
    icon: "/assets/icons/usp-time.svg",
  },
  {
    title: "Highly trusted by customers",
    icon: "/assets/icons/usp-clinicians.svg",
  },
  {
    title: "Track your progress",
    icon: "/assets/figma/icon-track-progress.svg",
  },
  {
    title: "Highly effective treatments",
    copy: "Modern treatments, backed by clinical research.",
    dark: true,
  },
];

export default function FeatureGrid() {
  return (
    <section
      aria-label="Treatment plan features"
      className="w-full bg-white py-16 md:py-[100px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <Reveal as="div" className="max-w-[476px] pb-10 text-center md:mx-auto">
          <h2 className="font-display text-[32px] leading-[40px] font-semibold text-[#142e2a] md:text-[48px] md:leading-[52px]">
            A treatment plan that works with your body
          </h2>
        </Reveal>

        {/* Top 6-column features */}
        <Reveal as="div" delay={100} className="grid grid-cols-2 gap-4 md:grid-cols-6 md:gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-2xl bg-[#f7f9f2] px-3 py-4 text-center"
            >
              <div className="grid h-[110px] w-[110px] place-items-center rounded-full bg-[#f7f9f2]">
                <Image
                  src={f.icon}
                  alt=""
                  width={60}
                  height={60}
                  className="h-12 w-12 md:h-[60px] md:w-[60px]"
                  aria-hidden
                />
              </div>
              <h3 className="font-ui text-[18px] font-semibold leading-[24px] text-[#142e2a] md:text-[25px] md:leading-[32px]">
                {f.title}
              </h3>
              <p className="font-ui text-[14px] leading-[20px] text-[#142e2a] md:text-[15px]">
                {f.copy}
              </p>
            </div>
          ))}
        </Reveal>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row">
          <a
            href="#get-started"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-12 font-ui text-[16.3px] font-semibold text-white md:w-[200px]"
          >
            Get started
          </a>
          <a
            href="#eligible"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-white px-12 font-ui text-[16.3px] font-semibold text-[#142f2b] ring-1 ring-[#142e2a]/10 md:w-[279px]"
          >
            See if you are eligible
          </a>
        </div>

        {/* Icon row */}
        <div className="no-scrollbar mt-10 flex gap-3 overflow-x-auto md:grid md:grid-cols-6 md:gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex w-[210px] shrink-0 flex-col justify-between rounded-2xl bg-[#f7f9f2] p-4 md:w-auto"
            >
              <p className="font-outfit text-[16px] font-semibold leading-[20px] text-[#000]">
                {f.title}
              </p>
              <div className="mt-3 grid h-[51px] w-[51px] place-items-center rounded-full bg-[#142e2a]">
                <Image
                  src={f.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 invert"
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom 3x2 grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BOTTOM_TILES.map((t, i) => (
            <div
              key={i}
              className={`flex h-[226px] flex-col justify-between rounded-lg p-4 ${
                t.dark
                  ? "bg-[#142e2a] text-white"
                  : "bg-[#f7f9f2] text-[#142e2a]"
              }`}
            >
              <h3
                className={`font-outfit font-medium ${
                  t.isBig
                    ? "text-[48px] leading-[60px]"
                    : "text-[24px] leading-[28px]"
                }`}
              >
                {t.title}
              </h3>
              {t.copy && (
                <p className="font-outfit text-[16px] leading-[22px]">
                  {t.copy}
                </p>
              )}
              {t.icon && (
                <Image
                  src={t.icon}
                  alt=""
                  width={42}
                  height={42}
                  className="h-[42px] w-[42px]"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
