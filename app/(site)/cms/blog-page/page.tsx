import { getBlogPageContent } from "@/lib/blogPageContent";

import BlogPageForm from "./BlogPageForm";

export const dynamic = "force-dynamic";

export default async function CmsBlogPageSettings() {
  const content = await getBlogPageContent();
  return <BlogPageForm initial={content} />;
}
