import Image from "next/image";

type Item = { icon: string; label: string };

// Mapped to the 5 Figma items in the Upsell Bar (Component 139):
//  1. UK Licensed medication   → usp-licensed (person in circle)
//  2. 24-Hour WhatsApp support → usp-whatsapp (24/7 dashed circle)
//  3. Free next-day delivery   → usp-delivery (package box)
//  4. Cancel anytime           → usp-cancel (clock)
//  5. Ongoing medical support  → usp-support (chat bubble)
const ITEMS: Item[] = [
  { icon: "/assets/figma/usp-licensed.svg", label: "UK Licensed medication" },
  { icon: "/assets/figma/usp-whatsapp.svg", label: "24-Hour WhatsApp support" },
  { icon: "/assets/figma/usp-delivery.svg", label: "Free next-day delivery" },
  { icon: "/assets/figma/usp-cancel.svg", label: "Cancel anytime subscription" },
  { icon: "/assets/figma/usp-support.svg", label: "Ongoing medical support" },
];

/**
 * A single inline row of USP items. Rendered multiple times back-to-back
 * so the marquee can loop seamlessly without a perceived jump.
 */
function MarqueeRow({ aria = false }: { aria?: boolean }) {
  return (
    <ul
      aria-hidden={aria}
      className="flex shrink-0 items-center"
    >
      {ITEMS.map((item, i) => (
        <li
          key={i}
          className="flex shrink-0 items-center gap-3 pr-12 md:pr-16"
        >
          <Image
            src={item.icon}
            alt=""
            width={32}
            height={32}
            className="h-7 w-7 shrink-0 md:h-8 md:w-8"
            aria-hidden
          />
          <span className="whitespace-nowrap font-ui text-[14.5px] font-semibold leading-[18px] tracking-[-0.02em] text-[#142e2a] md:text-[16.3px] md:leading-[19.5px]">
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
      className="w-full overflow-hidden border-b border-[#142e2a]/10 bg-white py-4 md:py-5"
    >
      {/* The track is twice as wide as the viewport (two copies of the
          row side-by-side). We slide it -50% over the configured duration
          so the second copy lands exactly where the first started — the
          loop is invisible. group-hover pauses the marquee for
          interaction. */}
      <div className="group flex w-full overflow-hidden">
        <div
          className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]"
          style={{ animationDuration: "32s" }}
        >
          <MarqueeRow />
          <MarqueeRow aria />
        </div>
      </div>
    </section>
  );
}
