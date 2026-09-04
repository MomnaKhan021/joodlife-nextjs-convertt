import "server-only";

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

/**
 * Server-side reader for the Treatments global.
 *
 * Returns the built-in categories with any CMS overrides merged in, so
 * callers keep the same `Record<CategoryKey, Category>` shape they had when
 * the data was a plain import.
 */

export * from "@/lib/treatmentContentTypes";

export async function getTreatmentOverrides(): Promise<TreatmentOverride[]> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "treatments",
      depth: 0,
      overrideAccess: true,
    })) as { categories?: unknown };
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
    return mergeDetails(await getTreatmentOverrides());
  } catch (err) {
    console.error("[treatmentContent] falling back to shipped copy:", err);
    return DEFAULT_DETAILS;
  }
}

/** The categories to render with — CMS copy over the built-in defaults. */
export async function getCategories(): Promise<Record<CategoryKey, Category>> {
  try {
    return mergeCategories(await getTreatmentOverrides());
  } catch (err) {
    console.error("[treatmentContent] falling back to shipped copy:", err);
    return CATEGORIES;
  }
}
