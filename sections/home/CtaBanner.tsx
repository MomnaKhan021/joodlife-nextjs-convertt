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
            className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <Image
              src="/assets/figma/cta-ellipse.svg"
              alt=""
              fill
              sizes="640px"
              className="object-contain opacity-80"
            />
          </div>

          <div className="relative grid grid-cols-1 items-center md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
            <div className="relative z-10 flex flex-col items-start gap-5 px-6 pt-10 pb-4 md:gap-6 md:px-12 md:py-16 lg:px-16 lg:py-20">
              <Image
                src="/assets/figma/icon-cta-arrow.svg"
                alt=""
                width={56}
                height={56}
                className="h-12 w-12 md:h-14 md:w-14"
                aria-hidden
              />

              <h2 className="max-w-[420px] font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[46px] lg:text-[48px] lg:leading-[54px]">
                Take the first step{" "}
                <em className="font-serif italic font-normal">
                  toward a better you
                </em>
              </h2>

              <p className="max-w-[360px] font-ui text-[15px] font-medium leading-[22px] text-[#142e2a]/80 md:text-[16px] md:leading-[24px]">
                Simple support for your goals, your routine, and your
                confidence.
              </p>
            </div>

            <div className="relative order-3 h-[300px] w-full md:order-2 md:h-full md:min-h-[500px]">
              <Image
                src="/assets/images/happy-woman-2.png"
                alt="Happy person smiling"
                fill
                sizes="(max-width: 768px) 100vw, 35vw"
                className="object-cover object-[center_20%] md:object-[center_center]"
                priority={false}
              />
            </div>

            <div className="relative z-10 order-2 flex w-full items-center justify-start px-6 pb-10 md:order-3 md:justify-end md:px-12 md:py-16 lg:px-16 lg:py-20">
              <a
                href="#get-started"
                className="inline-flex h-[52px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-xl bg-[#142e2a] px-10 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-white shadow-[0_8px_24px_rgba(20,46,42,0.18)] transition-colors duration-200 hover:bg-[#0c2421] md:h-[56px] md:w-auto md:text-[14px]"
              >
                Get started
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
