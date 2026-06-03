import Image from "next/image";

type Item = { icon: string; label: string };

/**
 * USP Marquee strip — Figma node 141:1910 (Component 139). The Figma
 * row is 1440×64 with each item being icon (32×32) + text (Saans
 * 16.3px / 20 line-height, weight 570) and ~32px gap between groups.
 *
 * We render the row twice in the track so a -50% translate yields a
 * seamless loop. group-hover pauses for interaction.
 */
const ITEMS: Item[] = [
  { icon: "/assets/figma/usp-licensed.svg", label: "UK Licensed medication" },
  { icon: "/assets/figma/usp-whatsapp.svg", label: "24-Hour WhatsApp support" },
  { icon: "/assets/figma/usp-delivery.svg", label: "Free next-day delivery" },
  { icon: "/assets/figma/usp-cancel.svg", label: "Cancel anytime subscription" },
  { icon: "/assets/figma/usp-support.svg", label: "Ongoing medical support" },
];

function MarqueeRow({ aria = false }: { aria?: boolean }) {
  return (
    <ul aria-hidden={aria} className="flex shrink-0 items-center">
      {ITEMS.map((item, i) => (
        <li key={i} className="flex shrink-0 items-center gap-3 pr-8 md:pr-[44px]">
          <Image
            src={item.icon}
            alt=""
            width={32}
            height={32}
            quality={95}
            className="h-8 w-8 shrink-0"
            aria-hidden
          />
          <span className="whitespace-nowrap font-ui text-[14px] font-semibold leading-[18px] tracking-[-0.02em] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function UspStrip() {
  return (
    <section
      aria-label="Why customers choose Jood Life"
      className="group w-full overflow-hidden border-b border-[#142e2a]/10 bg-white py-4 md:py-[14px]"
    >
      {/* Full-bleed track — no max-width or padding. The marquee runs
          edge-to-edge across the viewport, matching the Figma's full-
          width USP bar. */}
      <div className="flex w-full overflow-hidden">
        <div
          className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]"
          style={{ animationDuration: "40s" }}
        >
          <MarqueeRow />
          <MarqueeRow aria />
        </div>
      </div>
    </section>
  );
}
