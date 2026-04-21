import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

const STEPS = [
  {
    step: "1 Step",
    title: "Health assessment",
    copy: "Fill out a quick form about your medical background, daily habits, and wellness goals.",
    variant: "chart",
  },
  {
    step: "2 Step",
    title: "Expert review",
    copy: "Licensed providers in your state review your info and recommend the best course of action.",
    variant: "certified",
  },
  {
    step: "3 Step",
    title: "Get medication",
    copy: "Order affordable meds from vetted pharmacies or brand names.",
    variant: "medication",
  },
];

function Step1Visual() {
  return (
    <div className="relative mx-auto h-[259px] w-[260px]">
      <div className="absolute left-0 top-0 flex h-[215px] w-[177px] flex-col items-center gap-3 rounded-[18px] bg-[#e8efe4] px-6 py-3">
        <span className="font-serif text-[14px] italic text-[#142e2a]">
          Your weight- loss plan
        </span>
        <div className="relative h-[142px] w-[149px]">
          {/* Chart bars mimic */}
          <div className="absolute inset-0 grid grid-cols-9 gap-[6px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col justify-end gap-1">
                <div className="h-[8px] rounded-full bg-[#87af73]" />
                <div className="h-[8px] rounded-full bg-[#87af73]" />
                <div className="h-[8px] rounded-full bg-[#142e2a]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 flex h-[213px] w-[176px] flex-col items-center justify-between rounded-[18px] bg-white px-3 py-3">
        <p className="font-ui text-[18px] font-extrabold leading-[22px] text-[#142e2a]">
          What is your desired weight?
        </p>
        <div className="flex w-full items-center gap-2">
          <div className="h-[37px] flex-1 rounded-md bg-[#f4f5ef]" />
          <div className="grid h-[31px] w-[31px] place-items-center rounded-full bg-[#142e2a]">
            <span className="font-ui text-[14px] text-white">→</span>
          </div>
          <span className="font-outfit text-[14px] text-[#142e2a]">lbs</span>
        </div>
      </div>
    </div>
  );
}

function Step2Visual() {
  return (
    <div className="relative mx-auto h-[259px] w-[259px]">
      <Image
        src="/assets/figma/certified-professional.png"
        alt="Certified professional"
        fill
        sizes="259px"
        className="rounded-[15px] object-cover"
      />
      <div className="absolute left-1/2 bottom-3 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#142e2a] px-3 py-1.5">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white">
          <span className="text-[10px] text-[#142e2a]">✓</span>
        </span>
        <span className="font-ui text-[16px] font-semibold text-white">
          Certified
        </span>
      </div>
    </div>
  );
}

function Step3Visual() {
  return (
    <div className="relative mx-auto h-[259px] w-[279px]">
      <div className="absolute left-0 top-0 flex h-[212px] w-[177px] flex-col items-center gap-3 rounded-[18px] bg-[#e8efe4] px-6 py-3">
        <span className="font-serif text-[14px] italic text-[#142e2a]">
          Your Personalized Care
        </span>
        <div className="relative h-[142px] w-[149px]">
          <div className="absolute inset-0 grid grid-cols-9 gap-[6px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col justify-end gap-1">
                <div className="h-[8px] rounded-full bg-[#87af73]" />
                <div className="h-[8px] rounded-full bg-[#87af73]" />
                <div className="h-[8px] rounded-full bg-[#142e2a]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 flex h-[219px] w-[189px] flex-col items-center justify-between rounded-[18px] bg-white px-3 py-3">
        <p className="font-ui text-[18px] font-extrabold leading-[22px] text-[#142e2a]">
          Ready to Get Medication?
        </p>
        <div className="flex w-full items-center gap-2">
          <div className="relative h-[112px] w-[98px]">
            <Image
              src="/assets/figma/jood-injection-pen.png"
              alt="Jood injection pen"
              fill
              sizes="98px"
              className="object-contain"
            />
          </div>
          <div className="grid h-[33px] w-[33px] place-items-center rounded-full bg-[#142e2a]">
            <span className="font-ui text-[14px] text-white">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section aria-label="How it works" className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <Reveal as="div" className="flex flex-col items-center gap-2 pb-10 text-center">
          <h2 className="font-display text-[32px] leading-[40px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            How it <em className="font-serif italic font-normal">works</em>
          </h2>
          <p className="max-w-[562px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Address symptoms, treat root causes, and adjust your behaviours,
            for immediate relief and long-term optimal health.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal
              key={step.step}
              delay={i * 120}
              className="flex flex-col items-center gap-8 rounded-[20px] bg-[#f7f9f2] px-8 pt-8"
            >
              <div className="flex h-[260px] w-full items-center justify-center">
                {i === 0 && <Step1Visual />}
                {i === 1 && <Step2Visual />}
                {i === 2 && <Step3Visual />}
              </div>
              <div className="flex flex-col items-center gap-4 pb-8 text-center">
                <span className="inline-flex items-center rounded-full bg-[#87af73] px-5 py-1.5 font-ui text-[14px] text-white">
                  {step.step}
                </span>
                <h3 className="font-ui text-[22px] font-extrabold leading-[26px] text-[#142e2a] md:text-[25px]">
                  {step.title}
                </h3>
                <p className="font-ui text-[16px] leading-[20px] text-[#142e2a] md:text-[16.3px]">
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
