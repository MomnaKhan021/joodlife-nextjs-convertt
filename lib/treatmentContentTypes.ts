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
export type Chip = { label: string; sub: string; iconSrc: string };
export type Testimonial = { quote: string; name: string; meta: string };

/**
 * Content of the panel inside each category band — the part that differs per
 * treatment. Only the keys relevant to a category are used:
 *   weight-loss  → chipsLeft, chipsRight, ctaPrimary, ctaSecondary
 *   erectile-dysfunction → goals, testimonials
 *   period-delay → tags
 */
export type CategoryDetail = {
  chipsLeft?: Chip[];
  chipsRight?: Chip[];
  ctaPrimary?: string;
  ctaSecondary?: string;
  goals?: string[];
  testimonials?: Testimonial[];
  tags?: string[];
};

export const DEFAULT_DETAILS: Record<CategoryKey, CategoryDetail> = {
  "weight-loss": {
    chipsLeft: [
      { label: "Medication", sub: "Clinically-backed", iconSrc: "/assets/icons/chip-medication.svg" },
      { label: "Support", sub: "Long term", iconSrc: "/assets/icons/chip-support.svg" },
      { label: "Progress", sub: "Personalised care", iconSrc: "/assets/icons/chip-result.svg" },
    ],
    chipsRight: [
      { label: "Delivery", sub: "Free & Next-day", iconSrc: "/assets/icons/chip-delivery.svg" },
      { label: "Guidance", sub: "Long-term support", iconSrc: "/assets/icons/chip-guidance.svg" },
      { label: "WhatsApp", sub: "24/7 support", iconSrc: "/assets/icons/chip-whatsapp.svg" },
    ],
    ctaPrimary: "Start Your Journey",
    ctaSecondary: "Check Your Eligibility",
  },
  "erectile-dysfunction": {
    goals: [
      "Improve erections",
      "Boost sexual confidence",
      "Improve intimacy",
      "All of the above",
    ],
    testimonials: [
      {
        quote:
          "Treatment helped restore my confidence. I feel more in control and no longer worry about my erections.",
        name: "Jordan, 42",
        meta: "2 months into treatment",
      },
      {
        quote:
          "I feel like myself again. My confidence has improved, and intimacy no longer feels stressful.",
        name: "Michael, 46",
        meta: "6 weeks completed",
      },
      {
        quote:
          "I noticed a real difference in my performance and confidence. It's helped me feel more in control again.",
        name: "David, 39",
        meta: "1 month completed",
      },
      {
        quote:
          "This has made a big impact on both my confidence and my relationship. I feel much more relaxed and reassured now.",
        name: "Chris, 51",
        meta: "7 weeks completed",
      },
    ],
  },
  "period-delay": {
    tags: [
      "Hormones",
      "Period Delay",
      "Hormone Balance",
      "Progesterone",
      "Cycle Tracker",
      "Norethisterone",
      "Follicle",
      "Ovulation",
      "Menstrual Health",
      "Oestrogen",
    ],
  },
};

export type TreatmentOverride = {
  key: CategoryKey;
  detail?: CategoryDetail;
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
      detail: toDetail(v.detail),
    }));
}

function strings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((s): s is string => typeof s === "string" && s.trim() !== "");
  return out.length ? out : undefined;
}

function chips(value: unknown): Chip[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .filter(
      (v): v is Chip =>
        Boolean(v) && typeof v === "object" && typeof (v as Chip).label === "string",
    )
    .map((v) => ({
      label: v.label,
      sub: typeof v.sub === "string" ? v.sub : "",
      iconSrc: typeof v.iconSrc === "string" ? v.iconSrc : "",
    }));
  return out.length ? out : undefined;
}

function testimonials(value: unknown): Testimonial[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .filter(
      (v): v is Testimonial =>
        Boolean(v) &&
        typeof v === "object" &&
        typeof (v as Testimonial).quote === "string",
    )
    .map((v) => ({
      quote: v.quote,
      name: typeof v.name === "string" ? v.name : "",
      meta: typeof v.meta === "string" ? v.meta : "",
    }));
  return out.length ? out : undefined;
}

function toDetail(value: unknown): CategoryDetail | undefined {
  if (!value || typeof value !== "object") return undefined;
  const d = value as CategoryDetail;
  return {
    chipsLeft: chips(d.chipsLeft),
    chipsRight: chips(d.chipsRight),
    ctaPrimary: pick(d.ctaPrimary),
    ctaSecondary: pick(d.ctaSecondary),
    goals: strings(d.goals),
    testimonials: testimonials(d.testimonials),
    tags: strings(d.tags),
  };
}

/** Detail content per category — CMS values over the built-in defaults. */
export function mergeDetails(
  overrides: TreatmentOverride[],
): Record<CategoryKey, CategoryDetail> {
  const byKey = new Map(overrides.map((o) => [o.key, o]));
  const out = {} as Record<CategoryKey, CategoryDetail>;
  for (const key of TREATMENT_KEYS) {
    const base = DEFAULT_DETAILS[key];
    const d = byKey.get(key)?.detail;
    out[key] = !d
      ? base
      : {
          chipsLeft: d.chipsLeft ?? base.chipsLeft,
          chipsRight: d.chipsRight ?? base.chipsRight,
          ctaPrimary: d.ctaPrimary ?? base.ctaPrimary,
          ctaSecondary: d.ctaSecondary ?? base.ctaSecondary,
          goals: d.goals ?? base.goals,
          testimonials: d.testimonials ?? base.testimonials,
          tags: d.tags ?? base.tags,
        };
  }
  return out;
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
  detail: CategoryDetail;
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
      detail: mergeDetails(saved)[key],
    };
  });
}
