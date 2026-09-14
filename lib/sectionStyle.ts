import type { CSSProperties } from "react";

/**
 * Per-section styling — background, text colour and column order.
 *
 * Applied as INLINE STYLES, deliberately. Tailwind generates its classes by
 * scanning source at build time, so a runtime value like `bg-[${hex}]`
 * produces no CSS at all. Inline styles are the only way to honour a colour
 * the team picks in the CMS, and they also beat the existing utility class
 * on specificity, so the shipped `bg-white` can be overridden without
 * touching it.
 *
 * An unset style yields no style prop whatsoever, so a section with nothing
 * configured renders exactly as it ships. That is the property every part of
 * this CMS holds to: an empty global changes nothing.
 *
 * Client-safe — no `server-only`, no Payload import.
 */

export type SectionStyle = {
  /** Section background. "" means keep whatever the design ships with. */
  background: string;
  /** Text colour for the section. "" means keep the shipped colour. */
  text: string;
  /** Swap the order of a two-column layout. Ignored by single-column sections. */
  reverse: boolean;
};

export const EMPTY_STYLE: SectionStyle = {
  background: "",
  text: "",
  reverse: false,
};

/**
 * The brand palette, offered as swatches in the editor.
 *
 * A fixed palette rather than a free colour wheel: this is a pharmacy site
 * with a considered design, and the common case is "make this section the
 * dark green one", not "invent a colour". A custom hex is still accepted for
 * the times that isn't enough.
 */
export const BRAND_COLOURS: { label: string; value: string }[] = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#f7f9f2" },
  { label: "Dark green", value: "#142e2a" },
  { label: "Deep green", value: "#0c2421" },
  { label: "Lime", value: "#dff49f" },
  { label: "Mint", value: "#daffe0" },
  { label: "Sage", value: "#d3dabe" },
  { label: "Peach", value: "#fdf0ea" },
  { label: "Blush", value: "#ffcebf" },
  { label: "Blue", value: "#1a8ec1" },
];

/** #rgb, #rrggbb or #rrggbbaa. Anything else is treated as unset. */
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isColour(v: unknown): v is string {
  return typeof v === "string" && HEX.test(v.trim());
}

/**
 * The style prop for a section, or nothing at all.
 *
 * Returning an empty object (rather than `{ style: {} }`) matters: React
 * would otherwise emit `style=""` on every section, which is harmless but
 * makes a "nothing configured" page differ from the one that shipped.
 */
export function styleProps(s?: SectionStyle | null): { style?: CSSProperties } {
  if (!s) return {};
  const style: CSSProperties = {};
  if (isColour(s.background)) style.backgroundColor = s.background.trim();
  if (isColour(s.text)) style.color = s.text.trim();
  return Object.keys(style).length ? { style } : {};
}

/** True when this section should render its two columns the other way round. */
export function isReversed(s?: SectionStyle | null): boolean {
  return Boolean(s?.reverse);
}

function one(value: unknown): SectionStyle {
  const v = (value ?? {}) as Partial<SectionStyle>;
  return {
    background: isColour(v.background) ? v.background.trim() : "",
    text: isColour(v.text) ? v.text.trim() : "",
    reverse: v.reverse === true,
  };
}

/**
 * Merge a stored `styles` object into a map keyed by section.
 *
 * Unknown keys are dropped and malformed colours fall back to unset, so a
 * hand-edited or half-written value can only ever mean "use the design as
 * shipped" — never a broken page.
 */
export function mergeStyles<K extends string>(
  stored: unknown,
  keys: readonly K[],
): Record<K, SectionStyle> {
  const src =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  const out = {} as Record<K, SectionStyle>;
  for (const k of keys) out[k] = one(src[k]);
  return out;
}

/** Section keys that carry a style on the home page, in page order. */
export const HOME_STYLE_KEYS = [
  "hero",
  "reviews",
  "howItWorks",
  "faq",
  "blog",
  "cta",
] as const;
/**
 * Everything stored in the Home global's `styles`.
 *
 * The announcement bar is in here because its text lives on the same global,
 * but it is not a home-page section — it sits above the header on every page
 * — so it has its own editor and is deliberately absent from the list above,
 * which is what the home editor renders.
 */
export const HOME_STYLE_STORED_KEYS = [
  ...HOME_STYLE_KEYS,
  "announcement",
] as const;
export type HomeStyleKey = (typeof HOME_STYLE_STORED_KEYS)[number];

/**
 * Which sections actually have two columns worth swapping.
 *
 * Only the hero. The closing banner looks like a candidate but is a
 * three-column layout with its own mobile ordering already tuned; offering a
 * swap there would produce a jumble rather than a mirror, so the option
 * isn't shown for it.
 */
export const REVERSIBLE: ReadonlySet<string> = new Set(["hero"]);

/** Human labels for the editor, in the same order as the page. */
export const HOME_STYLE_LABELS: Record<HomeStyleKey, string> = {
  hero: "Hero",
  reviews: "Reviews",
  howItWorks: "How it works",
  faq: "FAQ",
  blog: "Blog posts",
  cta: "Closing banner",
  announcement: "Announcement bar",
};

/* ── the other pages, same shape ─────────────────────────
   Each page keeps its own key list so the editor can show its sections in
   page order, and so a key can never be styled on a page that has no such
   section. */

export const SUPPORT_STYLE_KEYS = ["hero", "faq", "stories"] as const;
export type SupportStyleKey = (typeof SUPPORT_STYLE_KEYS)[number];
export const SUPPORT_STYLE_LABELS: Record<SupportStyleKey, string> = {
  hero: "Hero and quick-help card",
  faq: "Questions",
  stories: "Success stories",
};

export const WEGOVY_STYLE_KEYS = [
  "announcement",
  "hero",
  "uspBar",
  "whatIsPill",
  "comparison",
  "howItWorks",
  "realResults",
  "dosing",
  "whyChoose",
  "faq",
  "finalCta",
] as const;
export type WegovyStyleKey = (typeof WEGOVY_STYLE_KEYS)[number];
export const WEGOVY_STYLE_LABELS: Record<WegovyStyleKey, string> = {
  announcement: "Strip above the header",
  hero: "Hero",
  uspBar: "Trust strip",
  whatIsPill: "What is the tablet",
  comparison: "Tablet vs injection",
  howItWorks: "How it works",
  realResults: "Real results",
  dosing: "Dosing & pricing",
  whyChoose: "Why choose Jood",
  faq: "Questions",
  finalCta: "Closing card",
};

export const ED_STYLE_KEYS = [
  "hero",
  "reviews",
  "journey",
  "plan",
  "steps",
  "confidence",
  "know",
  "banner",
] as const;
export type EdStyleKey = (typeof ED_STYLE_KEYS)[number];
export const ED_STYLE_LABELS: Record<EdStyleKey, string> = {
  hero: "Hero",
  reviews: "Review wall",
  journey: "Journey timeline",
  plan: "Treatment plan",
  steps: "How it works",
  confidence: "Confidence split",
  know: "Let’s get to know you",
  banner: "Closing banner",
};
