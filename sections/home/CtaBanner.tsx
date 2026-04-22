import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function CtaBanner() {
  return (
    <section
      aria-label="Call to action"
      className="w-full bg-white py-10 md:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-[24px] bg-[#e7ecd7] md:rounded-[32px]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 md:block"
          >
            <Image
              src="/assets/figma/cta-ellipse.svg"
              alt=""
              fill
              sizes="560px"
              className="object-contain"
            />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[1.05fr_1fr]">
            <div className="relative z-10 flex flex-col items-start gap-5 px-6 pt-10 pb-8 md:gap-6 md:px-12 md:pt-16 md:pb-16 lg:px-16 lg:pt-20 lg:pb-20">
              <Image
                src="/assets/figma/icon-cta-arrow.svg"
                alt=""
                width={56}
                height={56}
                className="h-12 w-12 md:h-14 md:w-14"
                aria-hidden
              />

              <h2 className="max-w-[440px] font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[42px] md:leading-[48px] lg:text-[48px] lg:leading-[54px]">
                Take the first step{" "}
                <em className="font-serif italic font-normal">
                  toward a better you
                </em>
              </h2>

              <p className="max-w-[400px] font-ui text-[15px] font-medium leading-[22px] text-[#142e2a]/80 md:text-[16px] md:leading-[24px]">
                Simple support for your goals, your routine, and your
                confidence.
              </p>

              <a
                href="#get-started"
                className="mt-2 inline-flex h-[50px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-xl bg-white px-10 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-[#142f2b] shadow-[0_4px_14px_rgba(20,46,42,0.08)] transition-colors duration-200 hover:bg-[#142e2a] hover:text-white md:h-[54px] md:w-auto md:text-[14px]"
              >
                Get started
              </a>
            </div>

            <div className="relative h-[300px] w-full md:h-auto md:min-h-[460px]">
              <Image
                src="/assets/figma/cta-bg.png"
                alt="Happy person smiling"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-[center_top] md:object-[center_center]"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
