import "server-only";

import { getPayloadInstance } from "@/lib/payload";
import {
  mergeCategories,
  type PostCategory,
} from "@/lib/postCategories";

/**
 * Server-side reader for the editable blog category list.
 *
 * Falls back to the shipped categories on any failure, so a missing table or
 * an unreachable database leaves /blogs with working filter tabs rather than
 * none.
 */

export * from "@/lib/postCategories";

export async function getBlogCategories(): Promise<PostCategory[]> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "blog-categories",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergeCategories(doc);
  } catch {
    return mergeCategories(null);
  }
}

/**
 * value → label, for turning stored categories into display names in bulk.
 * Cheaper than scanning the list once per post on a page of twelve.
 */
export async function getCategoryLabelMap(): Promise<Map<string, string>> {
  const list = await getBlogCategories();
  return new Map(list.map((c) => [c.value, c.label]));
}
