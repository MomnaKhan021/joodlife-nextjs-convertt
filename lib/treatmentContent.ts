import "server-only";

import { cache } from "react";

import { CATEGORIES, type Category, type CategoryKey } from "@/lib/categories";
import { getPayloadInstance } from "@/lib/payload";
import {
  DEFAULT_DETAILS,
  mergeCategories,
  mergeDetails,
  toTreatmentOverrides,
  type CategoryDetail,
  type TreatmentOverride,
} from "@/lib/treatmentContentTypes";
import {
  TREATMENT_STYLE_KEYS,
  mergeStyles,
  type SectionStyle,
  type TreatmentStyleKey,
} from "@/lib/sectionStyle";
import {
  TREATMENT_TEXT_KEYS,
  mergeTextStyles,
  textStylesFor,
  type TextStyle,
} from "@/lib/textStyle";

/**
 * Server-side reader for the Treatments global.
 *
 * Returns the built-in categories with any CMS overrides merged in, so
 * callers keep the same `Record<CategoryKey, Category>` shape they had when
 * the data was a plain import.
 */

export * from "@/lib/treatmentContentTypes";

/** The Treatments global, read once per request however many callers ask. */
const readTreatmentsDoc = cache(async () => {
  const payload = await getPayloadInstance();
  return (await payload.findGlobal({
    slug: "treatments",
    depth: 0,
    overrideAccess: true,
  })) as { categories?: unknown; styles?: unknown; textStyles?: unknown };
});

export async function getTreatmentOverrides(): Promise<TreatmentOverride[]> {
  try {
    const doc = await readTreatmentsDoc();
    return toTreatmentOverrides(doc?.categories);
  } catch (err) {
    console.error("[treatmentContent] falling back to shipped copy:", err);
    return [];
  }
}

/** Detail-panel content per category — CMS copy over the built-in defaults. */
export async function getCategoryDetails(): Promise<
  Record<CategoryKey, CategoryDetail>
> {
  try {
    const [details, look] = await Promise.all([
      getTreatmentOverrides().then(mergeDetails),
      getTreatmentLook(),
    ]);
    for (const key of Object.keys(details) as CategoryKey[]) {
      details[key] = { ...details[key], textStyles: textStylesFor(look.textStyles, key) };
    }
    return details;
  } catch (err) {
    console.error("[treatmentContent] falling back to shipped copy:", err);
    return DEFAULT_DETAILS;
  }
}

/** The categories to render with — CMS copy over the built-in defaults. */
export async function getCategories(): Promise<Record<CategoryKey, Category>> {
  try {
    const [cats, look] = await Promise.all([
      getTreatmentOverrides().then(mergeCategories),
      getTreatmentLook(),
    ]);
    for (const key of Object.keys(cats) as CategoryKey[]) {
      cats[key] = {
        ...cats[key],
        style: look.styles[key as TreatmentStyleKey],
        textStyles: textStylesFor(look.textStyles, key),
      };
    }
    return cats;
  } catch (err) {
    console.error("[treatmentContent] falling back to shipped copy:", err);
    return CATEGORIES;
  }
}

/** Per-category band colours and text sizes, falling back to the design. */
export async function getTreatmentLook(): Promise<{
  styles: Record<TreatmentStyleKey, SectionStyle>;
  textStyles: Record<string, TextStyle>;
}> {
  try {
    const doc = await readTreatmentsDoc();
    return {
      styles: mergeStyles(doc?.styles, TREATMENT_STYLE_KEYS),
      textStyles: mergeTextStyles(doc?.textStyles, TREATMENT_TEXT_KEYS),
    };
  } catch (err) {
    console.error("[treatmentContent] falling back to shipped look:", err);
    return {
      styles: mergeStyles(null, TREATMENT_STYLE_KEYS),
      textStyles: mergeTextStyles(null, TREATMENT_TEXT_KEYS),
    };
  }
}
