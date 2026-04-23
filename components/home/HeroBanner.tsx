import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Hero banner — matches the Figma "Home page - Desktop 2025, Dec 15"
 * and "Home page - Mobile 2025, Dec 12 V02" frames.
 *
 * Desktop: 1400x720 card (#142e2a), rounded-3xl (24px), two columns —
 * copy on the left (Trustpilot row → headline → 3 bullets → two buttons),
 * a cutout portrait of two women on the right with a "27 lbs" badge
 * floating bottom-right.
 *
 * Mobile: single dark-green card with stacked copy, one button, and
 * the same portrait flowing off the bottom.
 */
const BULLETS_DESKTOP = [
  "Lose up to 27% body weight",
  "Plans tailored to you",
  "Guidance for lasting results",
];

const BULLETS_MOBILE = [
  "Lose up to 27% body weight",
  "Guidance for lasting results",
  "Plans tailored to you",
];

function TrustpilotRow({ textClass = "text-white" }: { textClass?: string }) {
  return (
    <a
      href="https://www.trustpilot.com/review/joodlife.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View Jood Life reviews on Trustpilot"
      className="inline-flex cursor-pointer items-center gap-2 rounded-md transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
    >
      <Image
        src="/assets/icons/trustpilot-logo-only.svg"
        alt="Trustpilot"
        width={80}
        height={20}
        className="h-[20px] w-auto"
      />
      <Image
        src="/assets/icons/trustpilot-stars.svg"
        alt="5 stars"
        width={86}
        height={16}
        className="h-[16px] w-auto"
      />
      <span
        className={`font-inter text-[14.2px] leading-[17px] tracking-[-0.03em] ${textClass}`}
      >
        4.4 (50+) Reviews
      </span>
    </a>
  );
}

function TickBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Image
        src="/assets/figma/hero-red-tick.png"
        alt=""
        width={24}
        height={24}
        className="h-6 w-6 shrink-0"
        aria-hidden
      />
      <span className="font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.02em] text-[#d3dabe]">
        {children}
      </span>
    </li>
  );
}

function LbsBadge({ size = "desktop" }: { size?: "desktop" | "mobile" }) {
  const isDesktop = size === "desktop";
  return (
    <div
      className={`absolute rounded-[12px] bg-[#142e2a]/20 backdrop-blur-sm ${
        isDesktop ? "bottom-5 right-5 px-6 py-4" : "bottom-3 right-3 px-4 py-3"
      }`}
    >
      <p
        className={`font-display font-semibold tabular-nums leading-none text-white ${
          isDesktop ? "text-[48px]" : "text-[28px]"
        }`}
      >
        27<span className="ml-1 align-baseline font-ui text-[0.5em] font-bold uppercase tracking-[0.02em]">lbs</span>
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className={`block rounded-full bg-[#87af73] ${
            isDesktop ? "h-1 w-16" : "h-[3px] w-10"
          }`}
        />
      </div>
    </div>
  );
}

export default function HeroBanner() {
  return (
    <section
      aria-label="Hero"
      id="top"
      className="w-full bg-white px-0 pt-0 md:px-5 md:pt-5"
    >
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-3xl bg-[#142e2a]">
          <Reveal
            delay={0}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-12 px-[60px] py-[80px] lg:gap-16"
          >
            <div className="flex flex-col items-start gap-7">
              <TrustpilotRow />

              <h1 className="max-w-[580px] font-display text-[48px] font-semibold leading-[1.13] tracking-[-0.027em] text-white lg:text-[60px] lg:leading-[68px]">
                Innovative{" "}
                <em className="font-serif italic font-normal tracking-[-0.02em]">
                  weight loss,
                </em>
                <br />
                made just for you.
              </h1>

              <ul className="flex flex-col gap-3">
                {BULLETS_DESKTOP.map((b) => (
                  <TickBullet key={b}>{b}</TickBullet>
                ))}
              </ul>

              <div className="mt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#get-started"
                  className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-10 font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#d3dabe]"
                >
                  Get started
                </a>
                <a
                  href="#eligibility"
                  className="inline-flex h-[50px] items-center justify-center rounded-lg border border-white/40 bg-transparent px-10 font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-white/10"
                >
                  See if you are eligible
                </a>
              </div>
            </div>

            <div className="relative h-[620px]">
              <Image
                src="/assets/figma/hero-two-women-desktop.png"
                alt="Two happy customers"
                fill
                sizes="(min-width: 1024px) 700px, 50vw"
                className="object-contain object-right-bottom"
                priority
              />
              <LbsBadge size="desktop" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Mobile */}
      <div className="px-4 pb-0 pt-3 md:hidden">
        <Reveal className="relative mx-auto flex w-full flex-col overflow-hidden rounded-[16px] bg-[#142e2a]">
          <div className="flex flex-col gap-5 px-4 pt-6 pb-2">
            <TrustpilotRow />

            <h1 className="font-sofia text-[36px] font-medium leading-[38px] tracking-[-0.033em] text-white">
              Innovative{" "}
              <em className="font-serif italic font-normal">
                weight loss,
              </em>
              <br />
              made just for you.
            </h1>

            <ul className="flex flex-col gap-2.5">
              {BULLETS_MOBILE.map((b) => (
                <TickBullet key={b}>{b}</TickBullet>
              ))}
            </ul>

            <a
              href="#get-started"
              className="mt-2 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-white px-6 font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#d3dabe]"
            >
              Get started
            </a>
          </div>

          <div className="relative h-[320px] w-full">
            <Image
              src="/assets/figma/hero-two-women-mobile.png"
              alt="Two happy customers"
              fill
              sizes="100vw"
              className="object-contain object-bottom"
              priority
            />
            <LbsBadge size="mobile" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
