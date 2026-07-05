import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

const STEPS = [
  {
    step: "Step 01",
    title: "Complete your assessment",
    copy: "Answer a few quick questions about your health, medical history and treatment goals.",
    img: "/assets/figma/hiw-step1.png",
  },
  {
    step: "Step 02",
    title: "Clinical review",
    copy: "One of our experienced UK clinicians will review your assessment and recommend the most appropriate treatment, where clinically suitable.",
    img: "/assets/figma/hiw-step2.png",
  },
  {
    step: "Step 03",
    title: "Treatment delivered",
    copy: "If approved, your treatment will be prepared by our pharmacy and delivered quickly, discreetly and securely to your door.",
    img: "/assets/figma/hiw-step3.png",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="w-full scroll-mt-28 bg-white py-12 md:py-14 lg:py-[56px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div" className="flex flex-col items-center gap-2 pb-10 text-center">
          <h2 className="font-display text-[32px] leading-[40px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            How it <em className="font-serif italic font-normal">works</em>
          </h2>
          <p className="max-w-[562px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Getting started takes just a few minutes. Our clinicians review
            every assessment to ensure your treatment is safe and appropriate
            for you.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal
              key={step.step}
              delay={i * 120}
              className="flex flex-col items-center gap-7 rounded-[20px] bg-[#f7f9f2] px-8 pt-8"
            >
              <div className="relative h-[260px] w-full">
                <Image
                  src={step.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 90vw, 380px"
                  className="object-contain"
                  aria-hidden
                />
              </div>
              <div className="flex flex-col items-center gap-4 pb-8 text-center">
                <span className="inline-flex items-center rounded-full bg-[#142e2a]/[0.06] px-4 py-1.5 font-ui text-[13px] font-medium text-[#142e2a]">
                  {step.step}
                </span>
                <h3 className="font-display text-[22px] font-semibold leading-[26px] text-[#142e2a] md:text-[25px]">
                  {step.title}
                </h3>
                <p className="max-w-[34ch] font-ui text-[15px] leading-[21px] text-[#142e2a]/80 md:text-[16px]">
                  {step.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
