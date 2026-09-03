import Image from "next/image";

import {
  CATEGORY_PAGE_DEFAULT,
  type UspItem,
} from "@/lib/categoryPageContentTypes";

/**
 * USP Marquee strip — Figma node 141:1910 (Component 139). The Figma
 * row is 1440×64 with each item being icon (32×32) + text (Saans
 * 16.3px / 20 line-height, weight 570) and ~32px gap between groups.
 *
 * We render the row twice in the track so a -50% translate yields a
 * seamless loop. group-hover pauses for interaction.
 */
function MarqueeRow({
  items,
  aria = false,
}: {
  items: UspItem[];
  aria?: boolean;
}) {
  return (
    <ul aria-hidden={aria} className="flex shrink-0 items-center">
      {items.map((item, i) => (
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

export default function UspStrip({
  items = CATEGORY_PAGE_DEFAULT.uspStrip.items,
}: {
  items?: UspItem[];
}) {
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
          <MarqueeRow items={items} />
          <MarqueeRow items={items} aria />
        </div>
      </div>
    </section>
  );
}
