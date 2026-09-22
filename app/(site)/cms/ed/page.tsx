import { getEdContent } from "@/lib/edContent";

import EdForm from "./EdForm";

export const dynamic = "force-dynamic";

export default async function CmsEdPage() {
  const content = await getEdContent();
  return <EdForm initial={content} />;
}
