/**
 * Shared type scale for /foundayo, taken from the Figma
 * (AFTER – Jood updated copy). Figma's stand-in fonts map to the site's:
 * DM Sans → font-ui, Outfit → font-display (Gilroy), Fraunces → font-serif
 * (ITC Clearface), as the design's own notes ask.
 */

/** Page gutter: 16px mobile frame, 60px desktop frame. */
export const WRAP = "mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-[60px]";

/** Section heading — 36/43.2 mobile, 48/52 desktop, -1.2px tracking. */
export const H2 =
  "font-display text-[36px] !font-semibold leading-[43.2px] tracking-[-1.2px] md:text-[48px] md:leading-[52px]";

/** The italic half of a heading. */
export const ACCENT = "font-serif font-normal italic";

/** Body copy — 16.3/19.5, -0.3px tracking (both frames). */
export const BODY = "font-ui text-[16.3px] leading-[19.5px] tracking-[-0.3px]";

/** Button label — 16.3/19.5 medium. */
export const BTN_TEXT = "font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.3px]";

/** Dark filled button (50px tall, 8px radius). */
export const BTN_DARK = `${BTN_TEXT} inline-flex h-[50px] items-center justify-center rounded-lg border border-[#0c2421] bg-[#142e2a] px-[50px] text-white transition-colors hover:bg-[#0c2421]`;

/** White button with no stroke — the hero CTA (Figma has no border there). */
export const BTN_WHITE = `${BTN_TEXT} inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-[50px] text-[#142e2a] transition-colors hover:bg-[#daffe0]`;

/** White outlined button (50px tall, 8px radius). */
export const BTN_LIGHT = `${BTN_TEXT} inline-flex h-[50px] items-center justify-center rounded-lg border border-[#0c2421] bg-white px-[50px] text-[#142e2a] transition-colors hover:bg-[#daffe0]`;
