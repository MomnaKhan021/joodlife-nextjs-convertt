import Link from "next/link";

import { styleProps, type SectionStyle } from "@/lib/sectionStyle";
import {
  textStyleProps,
  type HomeTextKey,
  type TextStyle,
} from "@/lib/textStyle";

/** Peach pill on the dark bar, per the Figma announcement bar. */
function Badge({ label, ts }: { label: string; ts?: TextStyle }) {
  return (
    <span
      {...textStyleProps(ts)}
      className="inline-flex flex-shrink-0 items-center rounded-md bg-[#ffcebf] px-2.5 py-0.5 font-ui text-[12px] font-semibold text-[#142e2a]"
      aria-hidden
    >
      {label}
    </span>
  );
}

export type AnnouncementContent = {
  /** Background / text colour. Undefined keeps the shipped dark bar. */
  style?: SectionStyle;
  /** Per-text size and weight. Named apart from `text`, which is the message. */
  textStyles?: Partial<Record<HomeTextKey, TextStyle>>;
  badge?: string;
  text?: string;
  href?: string;
  hidden?: boolean;
};

/**
 * Presentational only — no async, no data access — so it stays safe to render
 * from a client boundary such as the article error page. `AnnouncementBar.tsx`
 * is the server wrapper that feeds it from the CMS.
 *
 * Defaults are the copy that shipped, so rendering it bare is unchanged.
 */
export default function AnnouncementBarView({
  style,
  textStyles = {},
  badge = "New",
  text = "Foundayo® (oral tirzepatide) – a new tablet option for weight management is now available",
  href = "/wegovy-pills",
  hidden = false,
}: AnnouncementContent = {}) {
  if (hidden || !text) return null;

  return (
    /* The colours sit on this wrapper so a stored one can win: an inline
       style beats a class on the same element, and the text below
       inherits rather than setting its own. */
    <div
      {...styleProps(style)}
      className="w-full bg-[#142e2a] text-white"
    >
      {/* Desktop: 44px tall, padded horizontally */}
      <div className="hidden md:flex mx-auto h-11 w-full max-w-[1440px] items-center justify-center px-10 lg:px-20">
        <div className="flex items-center gap-3">
          {badge ? <Badge label={badge} ts={textStyles.announcementBadge} /> : null}
          <Link
            href={href}
            {...textStyleProps(textStyles.announcementText)}
            className="font-outfit text-sm leading-snug hover:underline"
          >
            {text}
          </Link>
        </div>
      </div>

      {/* Mobile: compact, text wraps to two lines */}
      <div className="flex md:hidden mx-auto w-full items-center justify-center px-4 py-2">
        <div className="flex items-center gap-2.5">
          {badge ? <Badge label={badge} ts={textStyles.announcementBadge} /> : null}
          <Link
            href={href}
            {...textStyleProps(textStyles.announcementText)}
            className="font-outfit text-[13px] leading-snug hover:underline"
          >
            {text}
          </Link>
        </div>
      </div>
    </div>
  );
}
