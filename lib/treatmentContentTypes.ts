import { CATEGORIES, CATEGORY_ORDER, type Category, type CategoryKey } from "@/lib/categories";

/**
 * Editable slice of a treatment category.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor can
 * import it. `lib/treatmentContent.ts` is the server-side reader.
 *
 * Only copy, imagery and links are overridable. `theme` and the layout
 * numbers stay in lib/categories.ts — they're design tokens matched to the
 * Figma design, not content.
 */
export type TreatmentOverride = {
  key: CategoryKey;
  eyebrow?: string;
  cardTitle?: string;
  title?: string;
  titleAccent?: string;
  ctaLabel?: string;
  blurb?: string;
  bullets?: string[];
  cardImage?: string;
  heroImage?: string;
  imageAlt?: string;
  href?: string;
  learnMoreHref?: string;
};

/** The fields the editor exposes, in the order it shows them. */
export const TREATMENT_KEYS: CategoryKey[] = [...CATEGORY_ORDER];

function pick(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** Normalise whatever is stored in the global into clean overrides. */
export function toTreatmentOverrides(value: unknown): TreatmentOverride[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is TreatmentOverride =>
        Boolean(v) &&
        typeof v === "object" &&
        TREATMENT_KEYS.includes((v as TreatmentOverride).key),
    )
    .map((v) => ({
      key: v.key,
      eyebrow: pick(v.eyebrow),
      cardTitle: pick(v.cardTitle),
      title: pick(v.title),
      titleAccent: pick(v.titleAccent),
      ctaLabel: pick(v.ctaLabel),
      blurb: pick(v.blurb),
      bullets: Array.isArray(v.bullets)
        ? v.bullets.filter((b): b is string => typeof b === "string" && b.trim() !== "")
        : undefined,
      cardImage: pick(v.cardImage),
      heroImage: pick(v.heroImage),
      imageAlt: pick(v.imageAlt),
      href: pick(v.href),
      learnMoreHref: pick(v.learnMoreHref),
    }));
}

/**
 * Merge overrides over the built-in categories.
 *
 * Every field falls back individually, so a half-filled override still
 * renders correctly rather than blanking the rest of the card.
 */
export function mergeCategories(
  overrides: TreatmentOverride[],
): Record<CategoryKey, Category> {
  const byKey = new Map(overrides.map((o) => [o.key, o]));
  const out = {} as Record<CategoryKey, Category>;
  for (const key of TREATMENT_KEYS) {
    const base = CATEGORIES[key];
    const o = byKey.get(key);
    out[key] = !o
      ? base
      : {
          ...base,
          eyebrow: o.eyebrow ?? base.eyebrow,
          cardTitle: o.cardTitle ?? base.cardTitle,
          title: o.title ?? base.title,
          titleAccent: o.titleAccent ?? base.titleAccent,
          ctaLabel: o.ctaLabel ?? base.ctaLabel,
          blurb: o.blurb ?? base.blurb,
          bullets: o.bullets?.length ? o.bullets : base.bullets,
          cardImage: o.cardImage ?? base.cardImage,
          heroImage: o.heroImage ?? base.heroImage,
          imageAlt: o.imageAlt ?? base.imageAlt,
          href: o.href ?? base.href,
          learnMoreHref: o.learnMoreHref ?? base.learnMoreHref,
        };
  }
  return out;
}

/**
 * A fully-populated row for the editor: every field present, pre-filled from
 * the built-in copy so the form shows the live text rather than empty boxes.
 */
export type TreatmentRow = {
  key: CategoryKey;
  eyebrow: string;
  cardTitle: string;
  title: string;
  titleAccent: string;
  ctaLabel: string;
  blurb: string;
  bullets: string[];
  cardImage: string;
  heroImage: string;
  imageAlt: string;
  href: string;
  learnMoreHref: string;
};

/** Overrides pre-filled from the built-in values, for the editor form. */
export function overridesFromDefaults(
  saved: TreatmentOverride[],
): TreatmentRow[] {
  const byKey = new Map(saved.map((o) => [o.key, o]));
  return TREATMENT_KEYS.map((key) => {
    const base = CATEGORIES[key];
    const o = byKey.get(key);
    return {
      key,
      eyebrow: o?.eyebrow ?? base.eyebrow,
      cardTitle: o?.cardTitle ?? base.cardTitle,
      title: o?.title ?? base.title,
      titleAccent: o?.titleAccent ?? base.titleAccent,
      ctaLabel: o?.ctaLabel ?? base.ctaLabel ?? "",
      blurb: o?.blurb ?? base.blurb,
      bullets: o?.bullets?.length ? o.bullets : base.bullets,
      cardImage: o?.cardImage ?? base.cardImage,
      heroImage: o?.heroImage ?? base.heroImage,
      imageAlt: o?.imageAlt ?? base.imageAlt,
      href: o?.href ?? base.href,
      learnMoreHref: o?.learnMoreHref ?? base.learnMoreHref ?? "",
    };
  });
}
