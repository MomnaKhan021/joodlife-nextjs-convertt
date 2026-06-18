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

// Column split + exact Figma copy. Left column sits higher, right column
// is staggered ~64px lower around the portrait (Figma 289).
const LEFT_CHIPS: Chip[] = [
  { label: "Medication", sub: "Licensed treatment", icon: I.pill },
  { label: "Support", sub: "On going", icon: I.support },
  { label: "Result", sub: "Loss upto 26 %", icon: I.result },
];
const RIGHT_CHIPS: Chip[] = [
  { label: "Delivery", sub: "Next Day", icon: I.delivery },
  { label: "Guidance", sub: "For lasting result", icon: I.guidance },
  { label: "Whatapp", sub: "24/7 support", icon: I.chat },
];

function renderChip(c: Chip) {
  return (
    <li
      key={c.label}
      className="flex w-[140px] items-center gap-2 rounded-[10px] bg-[#142e2a] px-2.5 py-2 text-left md:w-[188px] md:gap-2.5 md:px-3 md:py-2.5"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#142e2a] md:h-10 md:w-10">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
          {c.icon}
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-ui text-[16px] font-medium leading-[20px] text-[#b4ff9f] md:text-[20px] md:leading-[23px]">
          {c.label}
        </span>
        <span className="truncate font-ui text-[12px] leading-[16px] text-white/75 md:text-[14px] md:leading-[19px]">
          {c.sub}
        </span>
      </span>
    </li>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-white/40 bg-white/5 px-6 font-ui text-[16px] font-medium text-white transition-colors duration-200 hover:bg-white/15"
    >
      {children}
    </Link>
  );
}

function FeatureRow({
  title,
  sub,
  iconSrc,
}: {
  title: string;
  sub: string;
  iconSrc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
        <Image src={iconSrc} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
      </span>
      <span className="flex flex-col">
        <span className="font-ui text-[18px] font-semibold leading-[24px] text-white md:text-[20px]">
          {title}
        </span>
        <span className="mt-0.5 font-ui text-[14px] leading-[19px] text-white/70">
          {sub}
        </span>
      </span>
    </li>
  );
}

/** "Introducing Wegovy Pills" card (Figma 67:1897, top of the WL panel). */
function WegovyIntroCard() {
  return (
    <Reveal
      as="div"
      className="relative overflow-hidden rounded-[24px] bg-black/20 p-6 backdrop-blur-[20px] md:p-8 lg:p-10"
    >
      <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div className="flex flex-col">
          <h3 className="font-display text-[26px] font-semibold leading-[1.14] tracking-[-0.01em] text-white md:text-[34px] md:leading-[40px]">
            Introducing <span className="text-[#b4ff9f]">Wegovy Pills</span>
            <br />
            care in the UK{" "}
            <em className="font-serif font-normal italic">through Jood Life</em>
          </h3>
          <p className="mt-3 max-w-[48ch] font-ui text-[16px] leading-[22px] text-white/80">
            A new option for weight loss, backed by{" "}
            <span className="text-[#b4ff9f]">UK-registered prescribers</span> and
            ongoing support.
          </p>

          <ul className="mt-6 flex flex-col gap-4">
            <FeatureRow
              title="Now available in the UK"
              sub="Wegovy® care, introduced by Jood."
              iconSrc="/assets/icons/wegovy-uk.svg"
            />
            <FeatureRow
              title="Clinician-led care you can trust"
              sub="Reviewed by UK-registered prescribers to ensure it’s right for you."
              iconSrc="/assets/icons/wegovy-clinician.svg"
            />
          </ul>

          <div className="mt-7">
            <Link
              href="/weight-loss#assessment"
              className="inline-flex h-[52px] w-fit items-center justify-center rounded-xl border border-white/40 bg-white/5 px-7 font-ui text-[16px] font-medium text-white transition-colors duration-200 hover:bg-white/15"
            >
              How Wegovy® works
            </Link>
          </div>
        </div>

        <div className="relative mx-auto h-[300px] w-full max-w-[440px] md:h-[380px]">
          <Image
            src="/assets/category/wl-wegovy.png"
            alt="A Jood Life member who started Wegovy treatment"
            fill
            quality={90}
            sizes="(max-width: 1024px) 80vw, 440px"
            className="object-contain object-center"
          />
        </div>
      </div>
    </Reveal>
  );
}

export default function WeightLossDetail() {
  return (
    <div className="flex flex-col gap-5">
      <WegovyIntroCard />
      <div className="grid gap-5 lg:grid-cols-2">
      {/* Card A — transformation (second on mobile per Figma) */}
      <Reveal as="div" className="order-2 flex flex-col items-center rounded-[24px] bg-black/20 p-6 text-center backdrop-blur-[20px] md:p-8 lg:order-1">
        <h3 className="font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.01em] text-white md:text-[34px] md:leading-[42px]">
          It&rsquo;s more than treatment,{" "}
          <em className="font-serif font-normal italic text-[#b4ff9f]">it&rsquo;s transformation</em>
        </h3>
        <p className="mt-3 max-w-[46ch] font-ui text-[16px] leading-[20px] text-white/80">
          A provider licensed in your state will review your information, so they can{" "}
          <span className="text-[#b4ff9f]">design a plan</span> around your body&rsquo;s needs.
        </p>

        {/* Chips flank the portrait — left column high, right staggered
            lower; portrait sits behind (absolute) so it stays responsive. */}
        <div className="relative mt-6 h-[330px] w-full shrink-0 md:h-[350px]">
          <div className="absolute bottom-0 left-1/2 z-0 h-[280px] w-[130px] -translate-x-1/2 md:h-[330px] md:w-[180px]">
            <Image
              src="/assets/category/wl-man.png"
              alt="A member supported through his weight-loss journey"
              fill
              quality={90}
              sizes="(max-width: 768px) 130px, 180px"
              className="object-contain object-bottom"
            />
          </div>
          <ul className="absolute left-0 top-0 z-10 flex flex-col gap-3 md:gap-3.5">
            {LEFT_CHIPS.map(renderChip)}
          </ul>
          <ul className="absolute right-0 top-[58px] z-10 flex flex-col gap-3 md:top-[64px] md:gap-3.5">
            {RIGHT_CHIPS.map(renderChip)}
          </ul>
        </div>

        <div className="mt-auto w-full pt-7">
          <GhostButton href="/weight-loss#assessment">Get Personalized Plan</GhostButton>
        </div>
      </Reveal>

      {/* Card B — continuous expert guidance (first on mobile per Figma) */}
      <Reveal as="div" delay={120} className="order-1 flex flex-col items-center rounded-[24px] bg-black/20 p-6 text-center backdrop-blur-[20px] md:p-8 lg:order-2">
        <h3 className="font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.01em] text-white md:text-[34px] md:leading-[42px]">
          Continuous, expert guidance
        </h3>

        <div className="relative mt-6 h-[320px] w-full flex-1 overflow-hidden rounded-[16px]">
          <Image
            src="/assets/category/wl-checkin.png"
            alt="Monthly video check-in with a licensed clinician"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 560px"
            className="object-contain"
          />
        </div>

        <p className="mt-6 font-serif text-[28px] font-normal italic text-[#b4ff9f] md:text-[34px]">
          at Every Step
        </p>
        <p className="mt-3 max-w-[46ch] font-ui text-[16px] leading-[20px] text-white/80">
          Get access to qualified medical professionals who are here to support you{" "}
          <span className="text-[#b4ff9f]">throughout your journey</span> whenever you need advice.
        </p>

        <div className="mt-6 w-full">
          <GhostButton href="/weight-loss#assessment">Get started</GhostButton>
        </div>
      </Reveal>
      </div>
    </div>
  );
}
