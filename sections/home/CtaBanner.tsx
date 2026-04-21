import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function CtaBanner() {
  return (
    <section aria-label="Call to action" className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-20">
        <Reveal as="div" className="relative flex h-auto min-h-[440px] items-center justify-between overflow-hidden rounded-3xl bg-[#e7ecd7] px-6 py-10 md:px-16 md:py-16">
          {/* Right image */}
          <div className="absolute right-0 top-1/2 h-[100%] w-[380px] -translate-y-1/2 md:w-[440px]">
            <Image
              src="/assets/figma/cta-bg.png"
              alt="Happy person"
              fill
              sizes="(max-width: 768px) 60vw, 440px"
              className="object-cover object-left"
            />
            <div className="absolute inset-0 bg-white/30" />
          </div>

          <div className="relative z-10 flex max-w-[425px] flex-col gap-5">
            <Image
              src="/assets/figma/icon-cta-arrow.svg"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
              aria-hidden
            />
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-[32px] leading-[40px] font-semibold text-[#142e2a] md:text-[48px] md:leading-[52px]">
                Take the first step{" "}
                <em className="font-serif italic font-normal">toward a better you</em>
              </h2>
              <p className="font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
                Simple support for your goals, your routine, and your confidence.
              </p>
            </div>
            <a
              href="#get-started"
              className="inline-flex h-[50px] w-fit items-center justify-center rounded-lg bg-white px-12 font-ui text-[13px] font-semibold uppercase tracking-[0.14em] text-[#142f2b] ring-1 ring-[#142e2a]/10 transition hover:bg-[#142e2a] hover:text-white"
            >
              Get started
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
