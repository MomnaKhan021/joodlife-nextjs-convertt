import { getHomeContent } from "@/lib/pageContent";
import AnnouncementForm from "./AnnouncementForm";

export const dynamic = "force-dynamic";

export default async function CmsAnnouncementPage() {
  const content = await getHomeContent();
  return <AnnouncementForm initial={content} />;
}
