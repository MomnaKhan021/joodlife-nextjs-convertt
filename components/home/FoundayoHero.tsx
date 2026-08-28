import Image from "next/image";
import Link from "next/link";

/**
 * Foundayo tablet hero (Figma "A new tablet option for weight management").
 * Replaces the previous gateway hero on the homepage.
 *
 * Layout: a peach card — copy on the left, the Foundayo pill on the right
 * (desktop); stacked with the pill below on mobile.
 *
 * Pill artwork lives at /assets/home/foundayo-pill.png (exported from the
 * Figma design — transparent PNG).
 */

const FEATURES = [
  { icon: TabletIcon, label: "Oral tablet treatment" },
  { icon: SyringeIcon, label: "No injections" },
  { icon: HeartIcon, label: "Clinician support" },
] as const;

export default function FoundayoHero({
  isReturningPatient = false,
}: {
  isReturningPatient?: boolean;
}) {
  return (
    <section className="w-full px-4 pt-4 md:px-10 lg:px-[60px]">
      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col overflow-hidden rounded-[24px] bg-[#f9e7e0] p-6 md:p-10 lg:flex-row lg:items-center lg:gap-6 lg:p-14">
        {/* Copy */}
        <div className="relative z-10 flex flex-col gap-5 lg:max-w-[58%]">
          <span className="inline-flex w-fit items-center rounded-md bg-[#e2957d] px-3 py-1 font-ui text-[12px] font-semibold text-white">
            New
          </span>

          <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-[#142e2a] sm:text-[38px] lg:text-[44px] lg:leading-[1.08]">
            A new tablet option{" "}
            <em className="font-serif font-normal italic">for weight management</em>
          </h1>

          <p className="max-w-[48ch] font-ui text-[14px] leading-[1.55] text-[#142e2a]/75 md:text-[15px]">
            Foundayo&reg; (oral tirzepatide) is a new weight management treatment
            option, available following clinician assessment.
          </p>

          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#bd7359]">
                    <Icon />
                  </span>
                  <span className="max-w-[9ch] font-ui text-[12px] font-medium leading-[1.2] text-[#142e2a] md:text-[13px]">
                    {f.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-1">
            <Link
              href={isReturningPatient ? "/reorder" : "/consultation"}
              className="btn-cta inline-flex h-[48px] items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421]"
            >
              {isReturningPatient ? "Reorder" : "Check Your Eligibility"}
            </Link>
          </div>
        </div>

        {/* Pill artwork — right on desktop, below on mobile. */}
        <div className="relative mt-8 h-[240px] w-full lg:mt-0 lg:h-[340px] lg:flex-1">
          <Image
            src="/assets/home/foundayo-pill.png"
            alt="Foundayo oral tablet"
            fill
            priority
            quality={90}
            sizes="(max-width: 1024px) 90vw, 40vw"
            className="object-contain object-center lg:object-right"
          />
        </div>
      </div>
    </section>
  );
}

/* ---- Coral outline feature icons (match the Figma) ---- */

function TabletIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
      <path d="M12 8.5v7" strokeLinecap="round" />
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6l-9 9-3 .8.8-3 9-9z" />
      <path d="M15 4.5l4.5 4.5M8 12l4 4M4 20l2-2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z" />
    </svg>
  );
}
