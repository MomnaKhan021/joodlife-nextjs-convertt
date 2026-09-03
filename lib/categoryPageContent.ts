import "server-only";

import {
  mergeCategoryPage,
  type CategoryPageContent,
} from "@/lib/categoryPageContentTypes";
import { getPayloadInstance } from "@/lib/payload";

/**
 * Server-side reader for the treatment sub-pages' shared furniture.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders the pages unchanged rather than blank.
 */

export * from "@/lib/categoryPageContentTypes";

export async function getCategoryPageContent(): Promise<CategoryPageContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "category-pages",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergeCategoryPage(doc);
  } catch {
    // Same merge with nothing stored, so the shipped copy comes back whole.
    return mergeCategoryPage(null);
  }
}
