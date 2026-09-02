import { getHomeContent } from "@/lib/pageContent";
import SectionsForm from "./SectionsForm";

export const dynamic = "force-dynamic";

export default async function CmsSectionsPage() {
  const content = await getHomeContent();
  return <SectionsForm initial={content} />;
}
