import { getBlogCategories } from "@/lib/blogCategories";

import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export default async function NewCmsPost() {
  const categories = await getBlogCategories();
  return <PostForm categories={categories} />;
}
