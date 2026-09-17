/**
 * Per-text size and weight, chosen next to the text it applies to.
 *
 * Two deliberate choices:
 *
 * 1. Sizes are *relative* (em), not pixels. Every heading on the site is
 *    responsive — `text-[24px] md:text-[34px]` and so on — so storing "28px"
 *    would flatten that and wreck the phone layout. An em multiplier rides on
 *    top of whatever the design already picked at that breakpoint, so
 *    "Larger" is larger on both mobile and desktop.
 *
 * 2. The value is applied as an inline style, never a class. Tailwind only
 *    generates CSS for classes it can see at build time, so a runtime
 *    `text-[${n}px]` produces nothing at all. Inline also outranks the
 *    shipped utility class, which is exactly what an override needs to do.
 *
 * Client-safe: no `server-only`, no Payload import, so the editors can import
 * it too.
 */

import type { CSSProperties } from "react";

export type TextSize = "" | "sm" | "lg" | "xl";
export type TextWeight = "" | "light" | "regular" | "medium" | "semibold" | "bold";

export type TextStyle = {
  size: TextSize;
  weight: TextWeight;
};

/** Nothing chosen — the text renders exactly as designed. */
export const EMPTY_TEXT_STYLE: TextStyle = { size: "", weight: "" };

export const TEXT_SIZES: { value: TextSize; label: string; em: number }[] = [
  { value: "", label: "Default", em: 1 },
  { value: "sm", label: "Smaller", em: 0.875 },
  { value: "lg", label: "Larger", em: 1.15 },
  { value: "xl", label: "Much larger", em: 1.3 },
];

export const TEXT_WEIGHTS: { value: TextWeight; label: string; css: number }[] = [
  { value: "", label: "Default", css: 0 },
  { value: "light", label: "Light", css: 300 },
  { value: "regular", label: "Regular", css: 400 },
  { value: "medium", label: "Medium", css: 500 },
  { value: "semibold", label: "Semibold", css: 600 },
  { value: "bold", label: "Bold", css: 700 },
];

const SIZE_EM = new Map(TEXT_SIZES.map((s) => [s.value, s.em]));
const WEIGHT_CSS = new Map(TEXT_WEIGHTS.map((w) => [w.value, w.css]));

/** True when this text has been given any treatment at all. */
export function hasTextStyle(t?: TextStyle | null): boolean {
  return Boolean(t && (t.size || t.weight));
}

/**
 * Spread onto the element that holds the text:
 *   <h1 {...textStyleProps(ts.heroTitle)} className="text-[24px] md:text-[34px]">
 *
 * Returns `{}` when nothing is set, so an untouched site renders byte for byte
 * what it renders today.
 */
export function textStyleProps(t?: TextStyle | null): { style?: CSSProperties } {
  if (!t) return {};
  const style: CSSProperties = {};
  const em = SIZE_EM.get(t.size);
  if (em && em !== 1) style.fontSize = `${em}em`;
  const weight = WEIGHT_CSS.get(t.weight);
  if (weight) style.fontWeight = weight;
  return Object.keys(style).length ? { style } : {};
}

/** Coerce one stored value, dropping anything unrecognised. */
function one(value: unknown): TextStyle {
  const v = (value ?? {}) as Partial<TextStyle>;
  return {
    size: SIZE_EM.has(v.size as TextSize) ? (v.size as TextSize) : "",
    weight: WEIGHT_CSS.has(v.weight as TextWeight) ? (v.weight as TextWeight) : "",
  };
}

/**
 * Merge the stored map over the defaults for a known set of field names.
 *
 * Keyed by the field the editor writes (`heroTitle`, `ctaTitle`, …) so the
 * control can sit beside that field and nothing has to be kept in step by
 * hand. Unknown keys in the database are ignored rather than trusted.
 */
export function mergeTextStyles<K extends string>(
  stored: unknown,
  keys: readonly K[],
): Record<K, TextStyle> {
  const src =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  const out = {} as Record<K, TextStyle>;
  for (const k of keys) out[k] = one(src[k]);
  return out;
}

/** The home-page texts that carry their own size/weight control. */
export const HOME_TEXT_KEYS = [
  "heroBadge",
  "heroTitle",
  "heroTitleEmphasis",
  "heroBody",
  "heroCtaLabel",
] as const;
export type HomeTextKey = (typeof HOME_TEXT_KEYS)[number];
