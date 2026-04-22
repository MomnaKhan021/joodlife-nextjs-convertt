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
            className="pointer-events-none absolute right-[-15%] top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 md:block"
          >
            <Image
              src="/assets/figma/cta-ellipse.svg"
              alt=""
              fill
              sizes="620px"
              className="object-contain opacity-80"
            />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="relative z-10 flex flex-col items-start gap-6 px-6 pt-10 pb-6 md:gap-7 md:px-14 md:pt-16 md:pb-16 lg:px-20 lg:pt-20 lg:pb-20">
              <Image
                src="/assets/figma/icon-cta-arrow.svg"
                alt=""
                width={56}
                height={56}
                className="h-12 w-12 md:h-14 md:w-14"
                aria-hidden
              />

              <h2 className="max-w-[460px] font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[42px] md:leading-[48px] lg:text-[52px] lg:leading-[58px]">
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
                className="mt-1 inline-flex h-[50px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-xl bg-white px-10 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-[#142f2b] shadow-[0_4px_14px_rgba(20,46,42,0.08)] transition-colors duration-200 hover:bg-[#142e2a] hover:text-white md:h-[54px] md:w-auto md:text-[14px]"
              >
                Get started
              </a>
            </div>

            <div className="relative h-[320px] w-full md:h-full md:min-h-[520px]">
              <Image
                src="/assets/images/happy-woman-2.png"
                alt="Happy person smiling"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-[center_20%] md:object-[center_center]"
                priority={false}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
