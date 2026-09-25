import { getCategoryPageContent } from "@/lib/categoryPageContent";
import { getEdContent } from "@/lib/edContent";

import EdForm from "./EdForm";

export const dynamic = "force-dynamic";

export default async function CmsEdPage() {
  // The FAQ block lives on the shared treatment-pages document. Loading it
  // here lets the ED screen show the questions that appear on this page.
  const [content, shared] = await Promise.all([
    getEdContent(),
    getCategoryPageContent(),
  ]);
  return <EdForm initial={content} shared={shared} />;
}
