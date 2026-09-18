/**
 * Per-text size and weight, chosen next to the text it applies to.
 *
 * Sizes are pixel numbers the editor types, because that is what was asked
 * for: any value, not a set of presets. Two consequences worth knowing.
 *
 * A pixel size is fixed, so a heading told to be 40px is 40px on a phone too,
 * where the design would have used 30. Each text therefore carries an optional
 * second value for small screens; left blank, the one size applies everywhere.
 *
 * Applied inline, never as a class: Tailwind only generates CSS for classes it
 * can see at build time, so a runtime `text-[40px]` produces no CSS at all.
 * Inline also outranks the shipped utility class, which is what an override has
 * to do. The mobile value rides along as a CSS variable, picked up by one rule
 * in globals.css — inline styles cannot hold a media query themselves.
 *
 * Client-safe: no `server-only`, no Payload import, so the editors import it too.
 */

import type { CSSProperties } from "react";

export type TextWeight = "" | "light" | "regular" | "medium" | "semibold" | "bold";

export type TextStyle = {
  /** Font size in px. 0 or absent means the size the design already uses. */
  px?: number;
  /** Optional override below 768px. Absent means `px` applies at every width. */
  pxMobile?: number;
  weight: TextWeight;
};

/** Nothing chosen — the text renders exactly as designed. */
export const EMPTY_TEXT_STYLE: TextStyle = { weight: "" };

export const TEXT_WEIGHTS: { value: TextWeight; label: string; css: number }[] = [
  { value: "", label: "Default", css: 0 },
  { value: "light", label: "Light", css: 300 },
  { value: "regular", label: "Regular", css: 400 },
  { value: "medium", label: "Medium", css: 500 },
  { value: "semibold", label: "Semibold", css: 600 },
  { value: "bold", label: "Bold", css: 700 },
];

const WEIGHT_CSS = new Map(TEXT_WEIGHTS.map((w) => [w.value, w.css]));

/** Sizes outside this are a typo, not an intention. */
export const MIN_PX = 8;
export const MAX_PX = 200;

/** A usable px number, or undefined. Keeps junk out of the rendered page. */
export function cleanPx(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : (value as number);
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  const r = Math.round(n);
  return r >= MIN_PX && r <= MAX_PX ? r : undefined;
}

/** True when this text has been given any treatment at all. */
export function hasTextStyle(t?: TextStyle | null): boolean {
  return Boolean(t && (t.px || t.pxMobile || t.weight));
}

/**
 * Spread onto the element holding the text:
 *   <h1 {...textStyleProps(text.heroTitle)} className="text-[30px] md:text-[42px]">
 *
 * Returns `{}` when nothing is set, so an untouched site renders byte for byte
 * what it renders today.
 */
export function textStyleProps(t?: TextStyle | null): { style?: CSSProperties } {
  if (!t) return {};
  const style: Record<string, string | number> = {};
  const px = cleanPx(t.px);
  const mob = cleanPx(t.pxMobile);
  if (px) style.fontSize = `${px}px`;
  // Custom property, not fontSize: a media query cannot live in an inline
  // style, so globals.css turns this into one below 768px.
  if (mob) style["--jl-fs-m"] = `${mob}px`;
  const weight = WEIGHT_CSS.get(t.weight);
  if (weight) style.fontWeight = weight;
  return Object.keys(style).length ? { style: style as CSSProperties } : {};
}

/** Coerce one stored value, dropping anything unrecognised. */
function one(value: unknown): TextStyle {
  const v = (value ?? {}) as Partial<TextStyle>;
  const out: TextStyle = {
    weight: WEIGHT_CSS.has(v.weight as TextWeight) ? (v.weight as TextWeight) : "",
  };
  const px = cleanPx(v.px);
  const mob = cleanPx(v.pxMobile);
  if (px) out.px = px;
  if (mob) out.pxMobile = mob;
  return out;
}

/**
 * Merge the stored map over the defaults for a known set of field names.
 *
 * Keyed by the field the editor writes (`heroTitle`, `ctaTitle`, ...) so the
 * control sits beside that field and nothing has to be kept in step by hand.
 * Unknown keys in the database are ignored rather than trusted.
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
  "reviewsHeading",
  "reviewsHeadingEmphasis",
  "reviewsIntro",
  "hiwHeading",
  "hiwHeadingEmphasis",
  "faqHeading",
  "faqHeadingEmphasis",
  "blogHeading",
  "blogHeadingEmphasis",
  "ctaTitle",
  "ctaTitleEmphasis",
  "ctaSubtitle",
  // The announcement bar: its copy lives on the Home global, so its sizes do too.
  "announcementBadge",
  "announcementText",
] as const;
export type HomeTextKey = (typeof HOME_TEXT_KEYS)[number];

/** The footer texts that carry their own size/weight control. */
export const FOOTER_TEXT_KEYS = [
  "contactHeading",
  "phone",
  "newsletterHeading",
  "newsletterSubtext",
  "legalText",
] as const;
export type FooterTextKey = (typeof FOOTER_TEXT_KEYS)[number];

/**
 * The header texts with their own size/weight control. `navLink`, the mega
 * menu's item label/description and the promo bullets are repeated items, so
 * one setting covers every instance.
 */
export const HEADER_TEXT_KEYS = [
  "navLink",
  "megaHeading",
  "megaItemLabel",
  "megaItemDesc",
  "promoTitle",
  "promoEmphasis",
  "promoBullet",
  "promoCta",
] as const;
export type HeaderTextKey = (typeof HEADER_TEXT_KEYS)[number];

/** Per-text keys for the Wegovy Pills page, derived from the editor's bindings. */
export const WEGOVY_TEXT_KEYS = [
  "announcement.text",
  "hero.body",
  "hero.reviewsLabel",
  "whatIsPill.kicker",
  "whatIsPill.body",
  "comparison.body",
  "comparison.pillTitle",
  "comparison.penTitle",
  "howItWorks.intro",
  "howItWorks.body",
  "howItWorks.secondaryLabel",
  "realResults.statPrefix",
  "realResults.statValue",
  "realResults.statSuffix",
  "realResults.statCaption",
  "realResults.studyTitle",
  "realResults.studyBody",
  "realResults.overlayTitle",
  "realResults.overlayBody",
  "dosing.body",
  "dosing.startBadge",
  "whyChoose.safetyTitle",
  "whyChoose.safetyBody",
  "finalCta.body",
  "finalCta.disclaimer",
  "hero.title",
  "hero.titleAccent",
  "whatIsPill.heading",
  "whatIsPill.headingAccent",
  "comparison.heading",
  "comparison.headingAccent",
  "howItWorks.heading",
  "howItWorks.headingAccent",
  "realResults.heading",
  "realResults.headingAccent",
  "dosing.heading",
  "dosing.headingAccent",
  "whyChoose.heading",
  "whyChoose.headingAccent",
  "faq.heading",
  "faq.headingAccent",
  "finalCta.heading",
  "finalCta.headingAccent",
  "hero.ctaLabel",
  "whatIsPill.ctaLabel",
  "comparison.ctaLabel",
  "howItWorks.ctaLabel",
  "finalCta.ctaLabel",
] as const;
export type WegovyTextKey = (typeof WEGOVY_TEXT_KEYS)[number];

/** Per-text keys for the erectile dysfunction page, derived from the editor's bindings. */
export const ED_TEXT_KEYS = [
  "hero.reviewsLabel",
  "reviews.reviewsLabel",
  "reviews.body",
  "journey.badge",
  "journey.cardBody",
  "journey.goalsHeading",
  "plan.headingTail",
  "plan.body",
  "steps.body",
  "confidence.eyebrow",
  "confidence.statCaption",
  "know.headingTail",
  "know.body",
  "know.quizBody",
  "know.progressBody",
  "know.progressNote",
  "know.progressNoteStrong",
  "banner.body",
  "hero.title",
  "hero.titleAccent",
  "reviews.heading",
  "reviews.headingAccent",
  "journey.heading",
  "journey.headingAccent",
  "plan.heading",
  "plan.headingAccent",
  "steps.heading",
  "steps.headingAccent",
  "confidence.heading",
  "confidence.headingAccent",
  "know.heading",
  "know.headingAccent",
  "banner.heading",
  "banner.headingAccent",
  "hero.ctaLabel",
  "hero.secondaryLabel",
  "journey.ctaLabel",
  "journey.secondaryLabel",
  "journey.cardCtaLabel",
  "plan.ctaLabel",
  "plan.secondaryLabel",
  "steps.ctaLabel",
  "confidence.ctaLabel",
  "confidence.secondaryLabel",
  "know.quizCtaLabel",
  "banner.ctaLabel",
  "confidence.statValue",
] as const;
export type EdTextKey = (typeof ED_TEXT_KEYS)[number];

/** Per-text keys for the Support page, derived from the editor's bindings. */
export const SUPPORT_TEXT_KEYS = [
  "hero.title",
  "hero.titleAccent",
  "hero.body",
  "hero.ctaLabel",
  "hero.cardPill",
  "faq.allLabel",
  "faq.ctaLabel",
  "stories.heading",
  "stories.headingAccent",
  "stories.body",
  "stories.ctaLabel",
] as const;
export type SupportTextKey = (typeof SUPPORT_TEXT_KEYS)[number];

/** Per-text keys for the blog listing page, derived from the editor's bindings. */
export const BLOG_PAGE_TEXT_KEYS = [
  "hero.title",
  "hero.titleAccent",
  "hero.body",
  "hero.ctaLabel",
  "list.heading",
  "list.body",
  "newsletter.heading",
  "newsletter.headingAccent",
  "newsletter.kicker",
  "newsletter.body",
  "newsletter.placeholder",
  "newsletter.submitLabel",
  "cta.title",
  "cta.body",
  "cta.ctaLabel",
] as const;
export type BlogPageTextKey = (typeof BLOG_PAGE_TEXT_KEYS)[number];

/** Per-text keys for the shared treatment-page sections. */
export const CATEGORY_PAGE_TEXT_KEYS = [
  "featureGrid.heading",
  "featureGrid.headingAccent",
  "featureGrid.body",
  "featureGrid.ctaLabel",
  "featureGrid.secondaryLabel",
  "faqs.heading",
  "faqs.headingAccent",
  "uspStrip.itemLabel",
  "featureGrid.featureTitle",
  "featureGrid.featureCopy",
  "faqs.question",
  "faqs.answer",
] as const;
export type CategoryPageTextKey = (typeof CATEGORY_PAGE_TEXT_KEYS)[number];

/**
 * Treatment texts are keyed per category ("weight-loss.title"), because the
 * editor draws one block per category. Views receive a category's own map with
 * bare field names — see textStylesFor.
 */
const TREATMENT_CATS = ["weight-loss", "erectile-dysfunction", "period-delay"];
export const TREATMENT_TEXT_FIELDS = [
  "eyebrow",
  "title",
  "titleAccent",
  "blurb",
  "ctaLabel",
  "card1Title",
  "card1Body",
  "card1Cta",
  "card2Title",
  "card2Body",
  "card3Title",
  "card3Em",
  "card3Body",
  "ctaPrimary",
  "ctaSecondary",
  "goalsTitle",
  "tagsTitle",
] as const;
export const TREATMENT_TEXT_KEYS: string[] = TREATMENT_CATS.flatMap((c) =>
  TREATMENT_TEXT_FIELDS.map((f) => `${c}.${f}`),
);

/** One category's sizes, keyed by bare field name ("title", "card1Body"). */
export function textStylesFor(
  all: Record<string, TextStyle> | undefined,
  cat: string,
): Partial<Record<string, TextStyle>> {
  const out: Partial<Record<string, TextStyle>> = {};
  if (!all) return out;
  const prefix = `${cat}.`;
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
}
