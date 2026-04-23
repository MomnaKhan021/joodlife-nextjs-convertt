import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import AnimatedLbsBadge from "./AnimatedLbsBadge";

/**
 * Hero banner — matches the Figma "Home page - Desktop 2025, Dec 15"
 * (1440x842 / card 1400x720) and "Home page - Mobile 2025, Dec 12 V02"
 * (390x771) frames, pulled via the Figma REST API.
 *
 * Desktop layout (exact Figma geometry):
 *  - Card: 1400 × 720, #142e2a, radius 24
 *  - Left column (text):   starts 40px from left, vertically centered
 *  - Right column (image): 616 wide, image is 817 wide (bleeds left),
 *                          bottom-aligned to the card
 *  - 27 lbs badge:         82px from right, 56px from bottom
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

export default function HeroBanner() {
  return (
    <section
      aria-label="Hero"
      id="top"
      className="w-full bg-white px-0 pt-0 md:px-5 md:pt-5"
    >
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="relative mx-auto h-[720px] w-full max-w-[1400px] overflow-hidden rounded-3xl bg-[#142e2a]">
          <Reveal
            delay={0}
            as="div"
            className="relative flex h-full items-center pl-10 pr-[85px]"
          >
            {/* Left column: copy. max-width is generous enough to let
               the headline's first line (which we force to one line
               via whitespace-nowrap) fit in our fallback Plus Jakarta
               Sans face, which is slightly wider than Gilroy-SemiBold
               used in the Figma. */}
            <div className="relative z-10 flex max-w-[720px] flex-col items-start gap-7">
              <TrustpilotRow />

              <h1 className="font-display text-[60px] font-semibold leading-[68px] tracking-[-0.027em] text-white">
                <span className="block whitespace-nowrap">
                  Innovative{" "}
                  <em className="font-serif italic font-normal tracking-[-0.02em]">
                    weight loss,
                  </em>
                </span>
                <span className="block">made just for you.</span>
              </h1>

              <ul className="flex flex-col gap-3">
                {BULLETS_DESKTOP.map((b) => (
                  <TickBullet key={b}>{b}</TickBullet>
                ))}
              </ul>

              <div className="mt-2 flex flex-wrap items-center gap-4">
                {/* Button widths from Figma: primary 200×50, secondary 279×50 */}
                <a
                  href="#get-started"
                  className="inline-flex h-[50px] w-[200px] items-center justify-center rounded-lg bg-white font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#d3dabe]"
                >
                  Get started
                </a>
                <a
                  href="#eligibility"
                  className="inline-flex h-[50px] w-[279px] items-center justify-center rounded-lg border border-white/40 bg-transparent font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-white transition-colors duration-200 hover:bg-white/10"
                >
                  See if you are eligible
                </a>
              </div>
            </div>

            {/* Right column: portrait. Figma places the image at
               x=5033, width 817, bottom-aligned to the card — i.e.
               about 23px from the card's right edge, extending 817px
               to the left. Absolute positioning so it can bleed
               into the left column area. */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-[23px] h-[634px] w-[817px]"
            >
              <Image
                src="/assets/figma/hero-two-women-desktop.png"
                alt=""
                fill
                sizes="817px"
                className="object-contain object-bottom"
                priority
              />
            </div>

            <div className="absolute bottom-14 right-[82px] z-10">
              <AnimatedLbsBadge size="desktop" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Mobile */}
      <div className="px-4 pb-0 pt-3 md:hidden">
        <Reveal
          as="div"
          className="relative mx-auto flex w-full flex-col overflow-hidden rounded-[12px] bg-[#142e2a]"
        >
          <div className="flex flex-col gap-5 px-4 pt-6 pb-3">
            <TrustpilotRow />

            <h1 className="font-sofia text-[36px] font-medium leading-[38px] tracking-[-0.033em] text-white">
              Innovative{" "}
              <em className="font-serif italic font-normal">weight loss,</em>
              <br />
              made just for you.
            </h1>

            <ul className="flex flex-col gap-2.5">
              {BULLETS_MOBILE.map((b) => (
                <TickBullet key={b}>{b}</TickBullet>
              ))}
            </ul>

            {/* Mobile button from Figma: 239×50 */}
            <a
              href="#get-started"
              className="mt-1 inline-flex h-[50px] w-[239px] items-center justify-center rounded-lg bg-white font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.02em] text-[#142f2b] transition-colors duration-200 hover:bg-[#d3dabe]"
            >
              Get started
            </a>
          </div>

          <div className="relative h-[320px] w-full">
            <Image
              src="/assets/figma/hero-two-women-mobile.png"
              alt=""
              fill
              sizes="100vw"
              className="object-contain object-bottom"
              priority
            />
            <div className="absolute bottom-4 right-4 z-10">
              <AnimatedLbsBadge size="mobile" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
