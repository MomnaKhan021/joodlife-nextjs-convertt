import Image from "next/image";
import Link from "next/link";

import Reveal from "@/components/ui/Reveal";
import Highlight from "@/components/ui/Highlight";

/**
 * Weight-loss section content (Figma Component 289, below the hero):
 *   • "It's more than treatment, it's transformation" card — provider
 *     copy, a 6-item benefit grid and a portrait, with a CTA.
 *   • "Continuous, expert guidance" card — the Monthly Check-in widget,
 *     supporting copy and a CTA.
 */

type Chip = { label: string; sub: string; iconSrc: string };

// Column split + exact Figma copy. Icons are the exact glyphs exported from
// the Figma (white circle + mark baked in). Left column sits higher, right
// column is staggered ~64px lower around the portrait (Figma 289).
const DEFAULT_LEFT_CHIPS: Chip[] = [
  { label: "Medication", sub: "Clinically-backed", iconSrc: "/assets/icons/chip-medication.svg" },
  { label: "Support", sub: "Long term", iconSrc: "/assets/icons/chip-support.svg" },
  { label: "Progress", sub: "Personalised care", iconSrc: "/assets/icons/chip-result.svg" },
];
const DEFAULT_RIGHT_CHIPS: Chip[] = [
  { label: "Delivery", sub: "Free & Next-day", iconSrc: "/assets/icons/chip-delivery.svg" },
  { label: "Guidance", sub: "Long-term support", iconSrc: "/assets/icons/chip-guidance.svg" },
  { label: "WhatsApp", sub: "24/7 support", iconSrc: "/assets/icons/chip-whatsapp.svg" },
];

function renderChip(c: Chip) {
  return (
    <li
      key={c.label}
      className="flex w-full items-center gap-2 rounded-[10px] bg-[#142e2a] px-2.5 py-2 text-left md:gap-2.5 md:px-3 md:py-2.5"
    >
      <Image
        src={c.iconSrc}
        alt=""
        width={40}
        height={40}
        className="h-7 w-7 shrink-0 md:h-10 md:w-10"
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-ui text-[13px] font-medium leading-[16px] text-[#b4ff9f] md:text-[20px] md:leading-[23px]">
          {c.label}
        </span>
        <span className="font-ui text-[11px] leading-[14px] text-white/75 md:text-[14px] md:leading-[18px]">
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
      className="btn-cta inline-flex h-[52px] w-full items-center justify-center rounded-xl border border-white/40 bg-white/5 px-6 font-ui text-[16px] font-medium text-white hover:bg-white/15"
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
        <Image
          src={iconSrc}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] [filter:brightness(0)_invert(1)]"
        />
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
function WegovyIntroCard({
  card1Title,
  card1Body,
  FEATURES,
  card1Cta,
}: {
  card1Title: string;
  card1Body: string;
  FEATURES: { title: string; sub: string }[];
  card1Cta: string;
}) {
  return (
    <Reveal
      as="div"
      className="relative overflow-hidden rounded-[16px] md:rounded-[24px] bg-black/20 px-5 pb-6 pt-8 backdrop-blur-[20px] md:p-8 lg:p-10"
    >
      <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div className="flex flex-col">
          <h3 className="font-display text-[18px] font-semibold leading-[1.2] tracking-[-0.01em] text-white md:text-[34px] md:leading-[40px]">
            <Highlight text={card1Title} />
          </h3>
          <p className="mt-3 max-w-[48ch] font-ui text-[14px] leading-[20px] text-white/80 md:text-[16px] md:leading-[22px]">
            <Highlight text={card1Body} />
          </p>

          <ul className="mt-6 flex flex-col gap-4">
            {FEATURES.map((f, i) => (
              <FeatureRow
                key={i}
                title={f.title}
                sub={f.sub}
                iconSrc={
                  i === 0
                    ? "/assets/icons/wegovy-uk.svg"
                    : "/assets/icons/wegovy-clinician.svg"
                }
              />
            ))}
          </ul>

          <div className="mt-7">
            <Link
              href="/wegovy-pills"
              className="btn-cta inline-flex h-[52px] w-fit items-center justify-center rounded-xl border border-white/40 bg-white/5 px-7 font-ui text-[16px] font-medium text-white hover:bg-white/15"
            >
              {card1Cta}
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

export type WeightLossDetailContent = {
  card1Title?: string;
  card1Body?: string;
  card1Features?: { title: string; sub: string }[];
  card1Cta?: string;
  card2Title?: string;
  card2Body?: string;
  card3Title?: string;
  card3Em?: string;
  card3Body?: string;
  chipsLeft?: Chip[];
  chipsRight?: Chip[];
  ctaPrimary?: string;
  ctaSecondary?: string;
};

export default function WeightLossDetail({
  card1Title = "New Oral Treatment Available\nPart of Jood's **clinician-led care**",
  card1Body = "A new oral treatment option, available following an **individual clinical assessment**.",
  card1Features,
  card1Cta = 'Learn More',
  card2Title = 'It’s more than treatment, **it’s transformation**',
  card2Body = 'Your clinician will review your health and create a **personalised treatment plan** tailored to your individual needs.',
  card3Title = 'Continuous, expert guidance',
  card3Em = 'Every step of the way',
  card3Body = 'Access experienced UK clinicians and dedicated support **throughout your weight loss journey**.',
  chipsLeft,
  chipsRight,
  ctaPrimary = 'Start Your Journey',
  ctaSecondary = 'Check Your Eligibility',
}: WeightLossDetailContent = {}) {
  const FEATURES = card1Features?.length
    ? card1Features
    : [
        { title: 'Personalised Assessment', sub: 'Every treatment starts with a clinical review.' },
        { title: 'Ongoing Support', sub: 'Expert guidance throughout your journey.' },
      ];
  const LEFT_CHIPS = chipsLeft?.length ? chipsLeft : DEFAULT_LEFT_CHIPS;
  const RIGHT_CHIPS = chipsRight?.length ? chipsRight : DEFAULT_RIGHT_CHIPS;
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <WegovyIntroCard
        card1Title={card1Title}
        card1Body={card1Body}
        FEATURES={FEATURES}
        card1Cta={card1Cta}
      />
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
      {/* Card A — transformation (second on mobile per Figma) */}
      <Reveal as="div" className="order-2 flex flex-col items-center rounded-[16px] md:rounded-[24px] bg-black/20 px-5 pb-6 pt-8 text-center backdrop-blur-[20px] md:p-8 lg:order-1">
        <h3 className="font-display text-[22px] font-semibold leading-[1.12] tracking-[-0.01em] text-white md:text-[34px] md:leading-[42px]">
          <Highlight
            text={card2Title}
            as="em"
            accentClass="font-serif font-normal italic text-[#b4ff9f]"
          />
        </h3>
        <p className="mt-3 max-w-[46ch] font-ui text-[14px] leading-[20px] text-white/80 md:text-[16px]">
          <Highlight text={card2Body} />
        </p>

        {/* Mobile / tablet: chips flow in a 2-column grid above a centred
            portrait, so nothing overlaps or gets clipped. */}
        <div className="mt-6 w-full lg:hidden">
          <ul className="grid grid-cols-2 gap-2.5">
            {[...LEFT_CHIPS, ...RIGHT_CHIPS].map(renderChip)}
          </ul>
          <div className="relative mx-auto mt-5 aspect-[150/212] w-[210px]">
            <Image
              src="/assets/category/wl-man.png"
              alt="A member supported through his weight-loss journey"
              fill
              quality={90}
              sizes="150px"
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Desktop: chips flank the portrait — left column high, right
            staggered lower; portrait sits behind (absolute). */}
        <div className="relative mt-6 hidden h-[400px] w-full shrink-0 lg:block">
          <div className="absolute bottom-0 left-1/2 z-0 h-[380px] w-[210px] -translate-x-1/2">
            <Image
              src="/assets/category/wl-man.png"
              alt=""
              fill
              quality={90}
              sizes="180px"
              className="object-contain object-bottom"
            />
          </div>
          <ul className="absolute left-0 top-0 z-10 flex w-[188px] flex-col gap-3.5">
            {LEFT_CHIPS.map(renderChip)}
          </ul>
          <ul className="absolute right-0 top-[64px] z-10 flex w-[188px] flex-col gap-3.5">
            {RIGHT_CHIPS.map(renderChip)}
          </ul>
        </div>

        <div className="mt-auto w-full pt-4 md:pt-7">
          <GhostButton href="/consultation?product=weight-loss">{ctaPrimary}</GhostButton>
        </div>
      </Reveal>

      {/* Card B — continuous expert guidance (first on mobile per Figma) */}
      <Reveal as="div" delay={120} className="order-1 flex flex-col items-center rounded-[16px] md:rounded-[24px] bg-black/20 px-5 pb-6 pt-8 text-center backdrop-blur-[20px] md:p-8 lg:order-2">
        <h3 className="font-display text-[24px] font-semibold leading-[1.12] tracking-[-0.01em] text-white md:text-[34px] md:leading-[42px]">
          {card3Title}
        </h3>

        <div className="relative mt-[18px] aspect-[300/211] w-full overflow-hidden rounded-[16px] md:rounded-[20px]">
          <Image
            src="/assets/category/wl-checkin.png"
            alt="Monthly video check-in with a licensed clinician"
            fill
            quality={90}
            sizes="(max-width: 1024px) 90vw, 560px"
            className="object-cover"
          />
        </div>

        <p className="mt-6 font-serif text-[24px] font-normal italic text-[#b4ff9f] md:text-[34px]">
          {card3Em}
        </p>
        <p className="mt-3 max-w-[46ch] font-ui text-[16px] leading-[20px] text-white/80">
          <Highlight text={card3Body} />
        </p>

        <div className="mt-6 w-full">
          <GhostButton href="/consultation?product=weight-loss">{ctaSecondary}</GhostButton>
        </div>
      </Reveal>
      </div>
    </div>
  );
}
