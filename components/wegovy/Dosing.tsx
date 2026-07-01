import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "Wegovy pill Dosing & Pricing" — Figma node 1:1996.
 * Intro + hand image, a four-step dose schedule, and a commit-and-save bar.
 */

type Dose = {
  mg: string;
  label: string;
  days: string;
  price: string;
  start?: boolean;
};

const DOSES: Dose[] = [
  { mg: "1.5mg", label: "Starting Dose", days: "Days 1–30", price: "£149/mo", start: true },
  { mg: "4mg", label: "Step-Up Dosing", days: "Days 31–60", price: "£149/mo" },
  { mg: "9mg", label: "Step-Up Dosing", days: "Days 61–90", price: "£299/mo" },
  { mg: "25mg", label: "Maintenance Dose", days: "Days 91+", price: "£299/mo" },
];

export default function Dosing() {
  return (
    <section
      aria-label="Wegovy pill dosing and pricing"
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
          <Reveal as="div">
            <h2 className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
              <span className="font-serif italic font-normal">Wegovy Pill</span>{" "}
              Dosing &amp; Pricing
            </h2>
            <p className="mt-4 max-w-[620px] font-ui text-[15px] leading-[22px] text-[#142e2a]/70 md:text-[16.3px] md:leading-[19.5px]">
              All prices include an initial order discount of £60, plus the £20
              saving we provide to patients who sign up to one of our 6-month
              commit-and-save plans. Pricing for the higher 9mg and 25mg doses
              will be determined before those doses become available in late
              July.
            </p>
          </Reveal>

          <Reveal as="div" delay={120} className="hidden lg:block">
            <div className="relative h-[260px] w-full overflow-hidden rounded-2xl">
              <Image
                src="/assets/wegovy/dosing-hand.png"
                alt="Hand holding a Wegovy pill"
                fill
                sizes="420px"
                className="object-contain object-right"
              />
            </div>
          </Reveal>
        </div>

        {/* Dose schedule */}
        <Reveal as="div" delay={150} className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DOSES.map((d) => (
            <div
              key={d.mg}
              className="relative flex flex-col gap-1 rounded-2xl border border-[#142e2a]/12 bg-[#f7f9f2] px-5 py-6"
            >
              {d.start ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-[#00b67a] px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-wide text-white">
                  Start Here
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
              <span className="mt-3 font-display text-[18px] font-semibold text-[#142e2a]">
                {d.price}
              </span>
            </div>
          ))}
        </Reveal>

        {/* Commit & save bar */}
        <Reveal as="div" delay={200}>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#142e2a] px-6 py-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00b67a]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3l2.5 5 5.5.8-4 3.9.95 5.5L12 21.5 7.05 18.2 8 12.7l-4-3.9L9.5 8 12 3z" fill="#fff" />
                </svg>
              </span>
              <div>
                <p className="font-ui text-[16px] font-semibold text-white">
                  Commit and save plan
                </p>
                <p className="font-ui text-[13px] text-white/75">
                  Sign up to a 6 month plan and we’ll take £20 off every month
                </p>
              </div>
            </div>
            <a
              href="/consultation"
              className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-lg bg-white px-8 font-ui text-[13px] font-semibold tracking-[-0.01em] text-[#142e2a] transition-colors hover:bg-[#daffe0]"
            >
              Get Started Today
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
