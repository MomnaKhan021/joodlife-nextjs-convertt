import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function CtaBanner() {
  return (
    <section
      aria-label="Call to action"
      className="w-full bg-white py-10 md:py-14"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-3xl bg-[#e7ecd7]"
        >
          <div className="relative grid grid-cols-1 items-stretch md:grid-cols-[1.1fr_1fr]">
            <div className="relative z-10 flex flex-col items-start gap-6 px-6 py-10 md:px-14 md:py-16 lg:px-16 lg:py-20">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#142e2a] md:h-14 md:w-14">
                <Image
                  src="/assets/figma/icon-cta-arrow.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0 invert md:h-7 md:w-7"
                  aria-hidden
                />
              </div>

              <h2 className="max-w-[460px] font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[44px] md:leading-[50px] lg:text-[48px] lg:leading-[54px]">
                Take the first step{" "}
                <em className="font-serif italic font-normal">
                  toward a better you
                </em>
              </h2>

              <p className="max-w-[420px] font-ui text-[15px] font-medium leading-[22px] text-[#142e2a]/80 md:text-[16px] md:leading-[24px]">
                Simple support for your goals, your routine, and your
                confidence.
              </p>

              <a
                href="#get-started"
                className="inline-flex h-12 w-full max-w-[260px] cursor-pointer items-center justify-center rounded-lg bg-white px-10 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-[#142f2b] ring-1 ring-[#142e2a]/15 transition-colors duration-200 hover:bg-[#142e2a] hover:text-white hover:ring-[#142e2a] md:h-[52px] md:w-auto md:text-[14px]"
              >
                Get started
              </a>
            </div>

            <div className="relative h-[260px] w-full md:h-auto md:min-h-[420px]">
              <Image
                src="/assets/figma/cta-bg.png"
                alt="Happy person"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center md:object-[left_center]"
                priority={false}
              />
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#e7ecd7] to-transparent md:w-32"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
