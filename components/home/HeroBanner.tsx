import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import HeroCarousel from "@/components/home/HeroCarousel";

const BULLETS = [
  "Lose up to 27% body weight",
  "Plans tailored to you",
  "Guidance for lasting results",
];

const CARDS = [
  "/assets/figma/hero-card-1.png",
  "/assets/figma/hero-card-2.png",
  "/assets/figma/hero-card-3.png",
  "/assets/figma/hero-card-4.png",
  "/assets/figma/hero-card-5.png",
  "/assets/figma/hero-card-6.png",
];

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="9"
        cy="9"
        r="8.25"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M5.5 9.25L8 11.75L12.75 6.75"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function TrustpilotRow() {
  return (
    <a
      href="https://www.trustpilot.com/review/joodlife.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View Jood Life reviews on Trustpilot"
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
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
      <span className="font-inter text-[14.2px] leading-[17px] tracking-normal text-white">
        4.4 (50+) Reviews
      </span>
    </a>
  );
}

export default function HeroBanner() {
  return (
    <section
      aria-label="Hero"
      id="top"
      className="w-full bg-white px-0 pt-5 md:px-5 md:pt-5"
    >
      <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-none bg-[#142e2a] md:rounded-3xl">
        {/* Desktop */}
        <div className="hidden md:block">
          <Reveal delay={0} className="flex flex-col items-center gap-8 px-[60px] pt-[80px] pb-14">
            <TrustpilotRow />
            <h1 className="max-w-[820px] text-center font-display text-[60px] font-semibold leading-[68px] tracking-[-0.02em] text-white">
              Innovative{" "}
              <em className="font-serif italic font-normal tracking-[-0.01em]">
                weight loss,
              </em>
              <br />
              made just for you.
            </h1>

            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckIcon />
                  <span className="font-ui text-[16px] leading-[20px] tracking-normal text-white">
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href="#get-started"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-14 font-ui text-[14px] font-semibold uppercase leading-[20px] tracking-[-0.01em] text-[#142f2b] transition hover:bg-[#d3dabe]"
            >
              Get started
            </a>
          </Reveal>

          <Reveal delay={200}>
            <HeroCarousel cards={CARDS} variant="desktop" />
          </Reveal>
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-8 pt-6 pb-8 md:hidden">
          <Reveal>
            <HeroCarousel cards={CARDS} variant="mobile" />
          </Reveal>

          <Reveal delay={200} className="flex flex-col items-center gap-6 px-6 text-center">
            <TrustpilotRow />
            <h1 className="font-display text-[36px] font-semibold leading-[42px] tracking-[-0.02em] text-white">
              Innovative{" "}
              <em className="font-serif italic font-normal tracking-[-0.01em]">
                weight loss,
              </em>
              <br />
              made just for you.
            </h1>
            <p className="font-ui text-[16px] leading-[22px] tracking-normal text-white/85">
              Unlock next-gen weight loss with clinically proven treatments.
              Take our 3-minute quiz to get started — no insurance needed.
            </p>
            <ul className="flex flex-col items-center gap-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckIcon />
                  <span className="font-ui text-[15px] leading-[20px] tracking-normal text-white">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#get-started"
              className="inline-flex h-[50px] w-full max-w-[240px] items-center justify-center rounded-lg bg-white px-12 font-ui text-[14px] font-semibold uppercase leading-[20px] tracking-[-0.01em] text-[#142f2b]"
            >
              Get started
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
