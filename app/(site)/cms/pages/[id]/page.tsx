import { notFound } from "next/navigation";

import { getPayloadInstance } from "@/lib/payload";
import PageForm, { type PageDoc } from "../PageForm";

export const dynamic = "force-dynamic";

export default async function EditCmsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let doc: PageDoc | null = null;
  try {
    const payload = await getPayloadInstance();
    doc = (await payload.findByID({
      collection: "pages",
      id,
      depth: 1,
      overrideAccess: true,
    })) as PageDoc;
  } catch {
    doc = null;
  }
  if (!doc) notFound();
  return <PageForm initial={doc} />;
}
