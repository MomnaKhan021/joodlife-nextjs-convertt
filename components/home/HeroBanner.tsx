import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

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
    <div className="flex items-center justify-center gap-2">
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
      <span className="font-inter text-[14.2px] leading-[17px] text-white">
        4.4 (50+) Reviews
      </span>
    </div>
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
        <div className="hidden md:flex flex-col items-center px-[60px] pt-20 gap-10">
          <Reveal delay={0} className="flex flex-col items-center gap-8">
            <TrustpilotRow />
            <h1 className="max-w-[820px] text-center font-display text-[60px] font-semibold leading-[68px] tracking-[-0.02em] text-white">
              Innovative{" "}
              <em className="font-serif italic font-normal">weight loss,</em>
              <br />
              made just for you.
            </h1>

            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckIcon />
                  <span className="font-ui text-[16px] leading-[20px] text-white">
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href="#get-started"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-16 font-ui text-[14px] font-semibold uppercase tracking-[0.12em] leading-[20px] text-[#142f2b] transition hover:bg-[#d3dabe]"
            >
              Get started
            </a>
          </Reveal>

          <Reveal delay={200} className="relative mt-6 w-full -mx-[60px]">
            <div className="no-scrollbar flex gap-[21.8px] overflow-x-auto px-[60px] pb-8">
              {CARDS.map((src, i) => (
                <div
                  key={i}
                  className="relative h-[436px] w-[597px] shrink-0 overflow-hidden rounded-3xl"
                >
                  <Image
                    src={src}
                    alt=""
                    width={1194}
                    height={872}
                    priority={i < 2}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col px-6 py-6 gap-8">
          <Reveal className="relative -mx-6">
            <div className="no-scrollbar flex gap-[10px] overflow-x-auto px-6 pb-[19px]">
              {CARDS.map((src, i) => (
                <div
                  key={i}
                  className="relative h-[259px] w-[300px] shrink-0 overflow-hidden rounded-2xl"
                >
                  <Image
                    src={src}
                    alt=""
                    width={600}
                    height={436}
                    priority={i < 2}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#142e2a] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#142e2a] to-transparent" />
          </Reveal>

          <Reveal delay={200} className="flex flex-col items-center gap-6 text-center">
            <TrustpilotRow />
            <h1 className="font-display text-[36px] font-semibold leading-[42px] tracking-[-0.01em] text-white">
              Innovative{" "}
              <em className="font-serif italic font-normal">weight loss,</em>
              <br />
              made just for you.
            </h1>
            <p className="font-ui text-[16px] leading-[22px] text-white/85">
              Unlock next-gen weight loss with clinically proven treatments.
              Take our 3-minute quiz to get started — no insurance needed.
            </p>
            <ul className="flex flex-col items-center gap-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckIcon />
                  <span className="font-ui text-[15px] leading-[20px] text-white">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#get-started"
              className="inline-flex h-[50px] w-full max-w-[240px] items-center justify-center rounded-lg bg-white px-12 font-ui text-[14px] font-semibold uppercase tracking-[0.12em] leading-[20px] text-[#142f2b]"
            >
              Get started
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
