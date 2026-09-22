import { getWegovyContent } from "@/lib/wegovyContent";

import WegovyForm from "./WegovyForm";

export const dynamic = "force-dynamic";

export default async function CmsWegovyPage() {
  const content = await getWegovyContent();
  return <WegovyForm initial={content} />;
}
