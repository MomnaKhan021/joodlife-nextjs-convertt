import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

const FEATURES = [
  {
    icon: "/assets/icons/usp-delivery.svg",
    title: "Discreet, next-day delivery",
    copy: "Next-day, unbranded, secure delivery with DPD",
  },
  {
    icon: "/assets/icons/usp-time.svg",
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

export default function FeatureGrid() {
  return (
    <section
      aria-label="Treatment plan features"
      className="w-full bg-white py-16 md:py-[100px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <Reveal as="div" className="pb-12 text-center md:mx-auto md:max-w-[700px]">
          <h2 className="font-display text-[32px] leading-[40px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[56px] md:leading-[64px]">
            A treatment plan that{" "}
            <em className="font-serif italic font-normal">works</em> with your
            body
          </h2>
        </Reveal>

        {/* 6-feature grid */}
        <Reveal as="div" delay={100} className="grid grid-cols-2 gap-4 md:grid-cols-6 md:gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 rounded-2xl bg-[#f7f9f2] px-4 py-8 text-center"
            >
              <div className="grid h-[90px] w-[90px] place-items-center rounded-full">
                <Image
                  src={f.icon}
                  alt=""
                  width={60}
                  height={60}
                  className="h-14 w-14 md:h-[60px] md:w-[60px]"
                  aria-hidden
                />
              </div>
              <h3 className="font-ui text-[18px] font-semibold leading-[24px] text-[#142e2a] md:text-[22px] md:leading-[28px]">
                {f.title}
              </h3>
              <p className="font-ui text-[13px] leading-[18px] text-[#142e2a]/80 md:text-[14px] md:leading-[20px]">
                {f.copy}
              </p>
            </div>
          ))}
        </Reveal>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row">
          <a
            href="#get-started"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-12 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-white transition hover:bg-[#0c2421] md:w-[200px]"
          >
            Get started
          </a>
          <a
            href="#eligible"
            className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-white px-12 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-[#142f2b] ring-1 ring-[#142e2a]/15 transition hover:bg-[#f7f9f2] md:w-[279px]"
          >
            See if you are eligible
          </a>
        </div>
      </div>
    </section>
  );
}
