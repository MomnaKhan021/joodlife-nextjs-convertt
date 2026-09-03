import { notFound } from "next/navigation";

import { getBlogCategories } from "@/lib/blogCategories";
import { getPayloadInstance } from "@/lib/payload";

import PostForm, { type PostDoc } from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditCmsPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await getBlogCategories();
  let doc: PostDoc | null = null;
  try {
    const payload = await getPayloadInstance();
    // depth 1 so heroImage arrives as the media doc, giving the picker a URL
    // to show rather than a bare id.
    doc = (await payload.findByID({
      collection: "posts",
      id,
      depth: 1,
      overrideAccess: true,
    })) as PostDoc;
  } catch {
    doc = null;
  }
  if (!doc) notFound();
  return <PostForm initial={doc} categories={categories} />;
}
