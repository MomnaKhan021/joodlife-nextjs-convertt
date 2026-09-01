import { getFooterContent } from "@/lib/siteContent";
import FooterForm from "./FooterForm";

export const dynamic = "force-dynamic";

export default async function CmsFooterPage() {
  const f = await getFooterContent();
  return <FooterForm initial={f} />;
}
