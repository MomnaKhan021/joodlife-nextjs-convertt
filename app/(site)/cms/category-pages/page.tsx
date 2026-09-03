import { getCategoryPageContent } from "@/lib/categoryPageContent";

import CategoryPagesForm from "./CategoryPagesForm";

export const dynamic = "force-dynamic";

export default async function CmsCategoryPages() {
  const content = await getCategoryPageContent();
  return <CategoryPagesForm initial={content} />;
}
