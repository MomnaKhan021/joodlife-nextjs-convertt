import { getSupportContent } from "@/lib/supportContent";

import SupportForm from "./SupportForm";

export const dynamic = "force-dynamic";

export default async function CmsSupportPage() {
  const content = await getSupportContent();
  return <SupportForm initial={content} />;
}
