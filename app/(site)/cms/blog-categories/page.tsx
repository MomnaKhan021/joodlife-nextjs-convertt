import { getBlogCategories } from "@/lib/blogCategories";
import { getPayloadInstance } from "@/lib/payload";

import CategoriesForm from "./CategoriesForm";

export const dynamic = "force-dynamic";

/**
 * How many posts sit under each category, so the editor can warn before
 * removing one that is in use. Counts every post, draft included — a draft
 * would still be orphaned.
 */
async function getCounts(): Promise<Record<string, number>> {
  try {
    const payload = await getPayloadInstance();
    const { docs } = await payload.find({
      collection: "posts",
      limit: 500,
      depth: 0,
      overrideAccess: true,
    });
    const counts: Record<string, number> = {};
    for (const d of docs as { category?: string | null }[]) {
      if (!d.category) continue;
      counts[d.category] = (counts[d.category] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

export default async function CmsBlogCategories() {
  const [categories, counts] = await Promise.all([
    getBlogCategories(),
    getCounts(),
  ]);
  return <CategoriesForm initial={categories} counts={counts} />;
}
