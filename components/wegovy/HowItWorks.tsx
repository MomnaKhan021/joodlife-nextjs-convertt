import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "How do Wegovy pills work?" — Figma node 1:1725.
 * Centred copy over a soft gradient pill image, with four mechanism
 * call-outs anchored to the corners on desktop.
 */

const CALLOUTS = [
  { label: "Reduces cravings", pos: "left-0 top-[26%]", align: "text-left" },
  { label: "Slow down your digestion", pos: "right-0 top-[26%]", align: "text-right" },
  { label: "Regulate your blood sugar⁵", pos: "left-0 bottom-[20%]", align: "text-left" },
  { label: "Regulate your appetite⁴", pos: "right-0 bottom-[20%]", align: "text-right" },
];

export default function HowItWorks() {
  return (
    <section
      aria-label="How Wegovy pills work"
      className="relative w-full overflow-hidden bg-[#dfe7d4]"
    >
      <Image
        src="/assets/wegovy/how-pill.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-90"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#dfe7d4]/55" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 py-16 text-center md:px-10 md:py-24">
        <Reveal as="div" className="mx-auto max-w-[760px]">
          <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[44px]">
            How Do{" "}
            <span className="font-serif italic font-normal">Wegovy Pills</span>{" "}
            Work?
          </h2>
          <p className="mx-auto mt-5 max-w-[680px] font-ui text-[14px] leading-[22px] text-[#142e2a]/80 md:text-[15px]">
            The Wegovy pill contains semaglutide, which is known as a GLP-1
            receptor agonist. This means it works by mimicking the natural GLP-1
            hormone found in your gut. The hormone’s job is to help:
          </p>
        </Reveal>

        {/* Mechanism call-outs */}
        <div className="relative mx-auto mt-10 hidden h-[300px] max-w-[920px] md:block">
          {CALLOUTS.map((c) => (
            <p
              key={c.label}
              className={`absolute ${c.pos} ${c.align} max-w-[190px] font-ui text-[15px] font-semibold leading-[20px] text-[#142e2a]`}
            >
              {c.label}
            </p>
          ))}
        </div>

        {/* Mobile: simple stacked list of the four mechanisms */}
        <ul className="mx-auto mt-8 flex max-w-[320px] flex-col gap-2 md:hidden">
          {CALLOUTS.map((c) => (
            <li
              key={c.label}
              className="rounded-full bg-white/70 px-4 py-2 font-ui text-[14px] font-semibold text-[#142e2a]"
            >
              {c.label}
            </li>
          ))}
        </ul>

        <Reveal as="div" delay={120}>
          <p className="mx-auto mt-10 max-w-[680px] font-ui text-[13px] leading-[21px] text-[#142e2a]/70">
            The tablet works the same as the Wegovy injection. However, instead
            of semaglutide entering the bloodstream directly via a needle, the
            pill goes via your stomach in a protective coating that can’t be
            dissolved by stomach acid and into the bloodstream through the walls
            of the small intestine.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <a
              href="/consultation"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-[#142e2a] px-9 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
            >
              Get started
            </a>
            <a
              href="#faq"
              className="inline-flex h-[50px] items-center justify-center rounded-lg border border-[#142e2a]/30 bg-white/60 px-9 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-[#142e2a] transition-colors hover:bg-white"
            >
              Learn more
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
