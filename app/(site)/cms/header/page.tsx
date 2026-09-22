import { getHeaderContent } from "@/lib/siteContent";
import HeaderForm from "./HeaderForm";

export const dynamic = "force-dynamic";

export default async function CmsHeaderPage() {
  const h = await getHeaderContent();
  return <HeaderForm initial={h} />;
}
