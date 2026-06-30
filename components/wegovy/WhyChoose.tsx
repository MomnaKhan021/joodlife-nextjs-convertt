import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "Why Choose Jood Life for Wegovy" — Figma node 1:2049.
 * Full-bleed lifestyle image with a darkened left column holding the
 * heading, three benefit rows and the safety disclaimer.
 */

const BENEFITS = [
  "MHRA-approved prescription treatment",
  "UK-licensed prescribers",
  "24/7 care team support",
];

export default function WhyChoose() {
  return (
    <section
      aria-label="Why choose Jood Life for Wegovy"
      className="relative flex min-h-[560px] w-full items-end overflow-hidden md:min-h-[640px] md:items-center"
    >
      <Image
        src="/assets/wegovy/why-runner.png"
        alt="Man running outdoors"
        fill
        sizes="100vw"
        className="object-cover object-[75%_top] md:object-[80%_top]"
      />
      {/* Mobile: dark gradient from bottom so the runner stays visible up top */}
      <div
        className="absolute inset-0 md:hidden"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, rgba(12,36,33,0.15) 0%, rgba(12,36,33,0.55) 45%, rgba(12,36,33,0.95) 100%)",
        }}
      />
      {/* Desktop: dark gradient anchored left */}
      <div
        className="absolute inset-0 hidden md:block"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(12,36,33,0.94) 0%, rgba(12,36,33,0.8) 42%, rgba(12,36,33,0.2) 70%, rgba(12,36,33,0) 90%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-16 md:px-10 md:py-24 lg:px-[60px]">
        <Reveal as="div" className="max-w-[560px]">
          <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[44px]">
            Why Choose Jood Life{" "}
            <span className="font-serif italic font-normal">For Wegovy</span>
          </h2>

          <ul className="mt-8 flex flex-col gap-3">
            {BENEFITS.map((b) => (
              <li
                key={b}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm"
              >
                <span className="font-ui text-[15px] font-medium text-white md:text-[16px]">
                  {b}
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/40 bg-white/10">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-[520px] font-ui text-[11px] leading-[16px] text-white/55">
            Wegovy causes thyroid C-cell tumors in rodents. Do not use Wegovy if
            you or your family have a history of medullary thyroid carcinoma
            (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).
          </p>
        </Reveal>
      </div>
    </section>
  );
}
