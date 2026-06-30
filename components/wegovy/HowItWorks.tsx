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
      className="relative w-full overflow-hidden rounded-[32px] bg-[#dfe7d4] mx-4 md:mx-8 lg:mx-[60px] py-[60px]"
    >
      <Image
        src="/assets/wegovy/how-pill.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(20,46,42,0.72) 0%, rgba(20,46,42,0.32) 38%, rgba(20,46,42,0.45) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 text-center md:px-10">
        <Reveal as="div" className="mx-auto max-w-[760px]">
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] md:leading-[52px]">
            How do{" "}
            <span className="font-serif italic font-normal">Wegovy pills</span>{" "}
            work?
          </h2>
          <p className="mx-auto mt-5 max-w-[680px] font-ui text-[14px] leading-[22px] text-white/85 md:text-[15px]">
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
              className={`absolute ${c.pos} ${c.align} max-w-[190px] font-ui text-[18px] font-semibold leading-[25.6px] text-white drop-shadow md:text-[25px]`}
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
              className="rounded-full bg-white/70 px-4 py-2 font-ui text-[16px] font-semibold text-[#142e2a]"
            >
              {c.label}
            </li>
          ))}
        </ul>

        <Reveal as="div" delay={120}>
          <p className="mx-auto mt-10 max-w-[680px] font-ui text-[13px] leading-[21px] text-white/75">
            The tablet works the same as the Wegovy injection. However, instead
            of semaglutide entering the bloodstream directly via a needle, the
            pill goes via your stomach in a protective coating that can’t be
            dissolved by stomach acid and into the bloodstream through the walls
            of the small intestine.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <a
              href="/consultation"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-9 font-ui text-[13px] font-semibold tracking-[-0.01em] text-[#142e2a] transition-colors hover:bg-[#daffe0]"
            >
              Get Started
            </a>
            <a
              href="#faq"
              className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/50 px-9 font-ui text-[13px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
