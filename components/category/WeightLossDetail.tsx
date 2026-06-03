import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";

/**
 * Weight-loss section content (Figma Component 289, below the hero):
 *   • "It's more than treatment, it's transformation" card — provider
 *     copy, a 6-item benefit grid and a portrait, with a CTA.
 *   • "Continuous, expert guidance" card — the Monthly Check-in widget,
 *     supporting copy and a CTA.
 */

type Chip = { label: string; sub: string; icon: React.ReactNode };

const I = {
  pill: (
    <path d="M8 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="1.4" />
  ),
  support: (
    <path d="M3 9a5 5 0 0 1 10 0v3a2 2 0 0 1-2 2M3 9v2a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  ),
  result: <path d="M3 12l3-3 2 2 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />,
  delivery: <path d="M2 5h8v6H2zM10 7h3l2 2v2h-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
  guidance: <path d="M8 2l2 4 4 .5-3 3 .8 4L8 11.5 4.2 13.5 5 9.5 2 6.5 6 6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />,
  chat: <path d="M3 4h10v7H7l-3 3v-3H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
};

const CHIPS: Chip[] = [
  { label: "Medication", sub: "Licensed treatment", icon: I.pill },
  { label: "Delivery", sub: "Next day", icon: I.delivery },
  { label: "Support", sub: "On-going", icon: I.support },
  { label: "Guidance", sub: "For lasting results", icon: I.guidance },
  { label: "Result", sub: "Loss up to 26%", icon: I.result },
  { label: "WhatsApp", sub: "24/7 support", icon: I.chat },
];

function renderChip(c: Chip) {
  return (
    <li key={c.label} className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/12 text-white">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          {c.icon}
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-ui text-[14px] font-semibold text-white">{c.label}</span>
        <span className="font-ui text-[12px] text-white/65">{c.sub}</span>
      </span>
    </li>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 bg-white/5 px-6 font-ui text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-white/15"
    >
      {children}
    </Link>
  );
}

export default function WeightLossDetail() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Card A — transformation */}
      <Reveal as="div" className="flex flex-col rounded-[24px] bg-black/20 p-6 backdrop-blur-[20px] md:p-8">
        <h3 className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] text-white md:text-[28px]">
          It&rsquo;s more than treatment,{" "}
          <em className="font-serif font-normal italic text-[#b4ff9f]">it&rsquo;s transformation</em>
        </h3>
        <p className="mt-3 max-w-[42ch] font-ui text-[14px] leading-relaxed text-white/80">
          A provider licensed in your state will review your information, so they can{" "}
          <span className="text-[#b4ff9f]">design a plan</span> around your body&rsquo;s needs.
        </p>

        {/* Desktop: chips flank the portrait (3 left / 3 right) */}
        <div className="mt-6 hidden flex-1 items-end justify-center gap-3 md:flex">
          <ul className="flex flex-col gap-5">{CHIPS.slice(0, 3).map(renderChip)}</ul>
          <div className="relative mx-1 h-[230px] w-[150px] shrink-0 self-end">
            <Image
              src="/assets/category/wl-man.png"
              alt="A member supported through his weight-loss journey"
              fill
              quality={90}
              sizes="150px"
              className="object-contain object-bottom"
            />
          </div>
          <ul className="flex flex-col gap-5">{CHIPS.slice(3, 6).map(renderChip)}</ul>
        </div>

        {/* Mobile: portrait above a 2-column chip grid */}
        <div className="mt-6 flex flex-col items-center gap-5 md:hidden">
          <div className="relative h-[200px] w-[140px]">
            <Image
              src="/assets/category/wl-man.png"
              alt="A member supported through his weight-loss journey"
              fill
              quality={90}
              sizes="140px"
              className="object-contain object-bottom"
            />
          </div>
          <ul className="grid w-full grid-cols-2 gap-4">{CHIPS.map(renderChip)}</ul>
        </div>

        <div className="mt-7">
          <GhostButton href="/weight-loss#assessment">Get Personalized Plan</GhostButton>
        </div>
      </Reveal>

      {/* Card B — continuous expert guidance */}
      <Reveal as="div" delay={120} className="flex flex-col rounded-[24px] bg-black/20 p-6 backdrop-blur-[20px] md:p-8">
        <h3 className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] text-white md:text-[28px]">
          Continuous, expert guidance
        </h3>

        <div className="relative mt-6 h-[300px] w-full overflow-hidden rounded-[16px]">
          <Image
            src="/assets/category/wl-checkin.png"
            alt="Monthly video check-in with a licensed clinician"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 560px"
            className="object-contain"
          />
        </div>

        <p className="mt-6 font-serif text-[22px] font-normal italic text-[#b4ff9f]">at Every Step</p>
        <p className="mt-2 max-w-[44ch] font-ui text-[14px] leading-relaxed text-white/80">
          Get access to qualified medical professionals who are here to support you throughout
          your journey whenever you need advice.
        </p>

        <div className="mt-6">
          <GhostButton href="/weight-loss#assessment">Get started</GhostButton>
        </div>
      </Reveal>
    </div>
  );
}
