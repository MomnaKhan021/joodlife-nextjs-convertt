import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { WEGOVY_DEFAULT, type WegovyDosing } from "@/lib/wegovyContentTypes";

/**
 * "Wegovy pill Dosing & Pricing" — Figma node 1:1996.
 * Intro + hand image, a four-step dose schedule, and a commit-and-save bar.
 */

export default function Dosing({
  content = WEGOVY_DEFAULT.dosing,
}: {
  content?: WegovyDosing;
}) {
  return (
    <section
      aria-label="Wegovy pill dosing and pricing"
      className="w-full bg-white py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
          <Reveal as="div">
            <h2 className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
              <span className="font-serif italic font-normal">
                {content.heading}
              </span>{" "}
              {content.headingAccent}
            </h2>
            <p className="mt-4 max-w-[620px] font-ui text-[15px] leading-[22px] text-[#142e2a]/70 md:text-[16.3px] md:leading-[19.5px]">
              {content.body}
            </p>
          </Reveal>

          <Reveal as="div" delay={120} className="hidden lg:block">
            <div className="relative h-[260px] w-full overflow-hidden rounded-2xl">
              <Image
                src={content.image}
                alt={content.imageAlt}
                fill
                sizes="420px"
                className="object-contain object-right"
              />
            </div>
          </Reveal>
        </div>

        {/* Dose schedule */}
        <Reveal as="div" delay={150} className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {content.doses.map((d, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-1 rounded-2xl border border-[#142e2a]/12 bg-[#f7f9f2] px-5 py-6"
            >
              {d.start ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-[#00b67a] px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-wide text-white">
                  {content.startBadge}
                </span>
              ) : null}
              <span className="font-display text-[26px] font-semibold leading-none text-[#142e2a]">
                {d.mg}
              </span>
              <span className="font-ui text-[13px] font-medium text-[#142e2a]/80">
                {d.label}
              </span>
              <span className="font-ui text-[12px] text-[#142e2a]/55">
                {d.days}
              </span>
              <span className="mt-3 font-display text-[15px] font-semibold leading-[20px] text-[#142e2a]">
                {d.price}
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
