import Image from "next/image";

import type { LanderTrust } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import { LP_ASSETS, LP_GUTTER, TrustpilotLink } from "./shared";

function Check({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#142e2a] ${
        small ? "size-[16px]" : "size-[26px]"
      }`}
    >
      <Image src={`${LP_ASSETS}/check.svg`} alt="" width={15} height={15} unoptimized className={small ? "size-[9.23px]" : "size-[15px]"} />
    </span>
  );
}

/** One copy of the phone strip — rendered twice so the marquee loops. */
function MobileRow({ c, hidden = false }: { c: LanderTrust; hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-[18px] pr-[18px]" aria-hidden={hidden || undefined}>
      <TrustpilotLink className="flex items-center gap-[4px] whitespace-nowrap text-[12px] font-medium leading-[10.8px] text-[#142e2a]">
        <span className="flex items-center gap-[4px] font-ui">
        {c.reviewsLabel}
        <span className="flex items-center gap-[3px]">
          <Image src={`${LP_ASSETS}/tp-star.svg`} alt="" width={14} height={13} unoptimized />
          Trustpilot
        </span>
        </span>
        <Image src={`${LP_ASSETS}/m-tp-stars.svg`} alt="" width={83} height={16} unoptimized className="ml-[2px]" />
      </TrustpilotLink>
      {c.badges.map((b, i) => (
        <span
          key={`${b}-${i}`}
          className={`flex items-center gap-[6px] whitespace-nowrap pr-[18px] ${
            i < c.badges.length - 1 ? "border-r-[0.8px] border-[#d7dbd1]" : ""
          }`}
        >
          <Check small />
          <span className="font-ui text-[14px] font-medium tracking-[-0.5px] text-[#142e2a]">{b}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Trust strip under the hero (Figma 20:377; mobile 20:909). Desktop is a
 * fixed row; on phones the row is wider than the screen, so it scrolls
 * as a marquee instead of being cut off.
 */
export default function LpTrustStrip({ content: c, style }: { content: LanderTrust; style?: SectionStyle }) {
  return (
    <section aria-label="Why patients trust Jood" className="border-b border-[#e7ecd7] bg-white" {...styleProps(style)}>
      {/* Phones — auto-scrolling row */}
      <div className="overflow-hidden py-[16px] lg:hidden">
        <div className="flex w-max animate-marquee" style={{ animationDuration: "22s" }}>
          <MobileRow c={c} />
          <MobileRow c={c} hidden />
        </div>
      </div>

      {/* Desktop — Trustpilot + equal badges */}
      <div className={`mx-auto hidden max-w-[1440px] items-center gap-[65px] py-[20px] lg:flex ${LP_GUTTER}`}>
        <TrustpilotLink className="flex shrink-0 items-center gap-[9px]">
          <span className="flex items-center gap-[5px]">
            <Image src={`${LP_ASSETS}/tp-star.svg`} alt="" width={21} height={20} unoptimized />
            <span className="font-ui text-[16px] font-medium leading-[16px] text-[#142e2a]">Trustpilot</span>
          </span>
          <Image src={`${LP_ASSETS}/tp-stars.svg`} alt="Rated 5 stars" width={123} height={23} unoptimized />
          <span className="font-ui text-[16px] font-medium leading-[16px] text-[#142e2a]">
            <strong className="font-bold">{c.rating}</strong> out of 5
          </span>
        </TrustpilotLink>
        {c.badges.map((b, i) => (
          <div
            key={`${b}-${i}`}
            className={`flex h-[46px] min-w-0 flex-1 items-center gap-[12px] py-[5px] pr-[18px] ${
              i < c.badges.length - 1 ? "border-r-[0.8px] border-[#d7dbd1]" : ""
            }`}
          >
            <Check />
            <span className="font-ui text-[16px] font-medium tracking-[-0.5px] text-[#142e2a]">{b}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
