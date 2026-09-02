import { getHomeContent } from "@/lib/pageContent";
import AnnouncementBarView from "./AnnouncementBarView";

/**
 * Server wrapper: reads the announcement from the Home global and renders the
 * presentational bar. Exists so the ~20 pages that render <AnnouncementBar />
 * keep working unchanged.
 *
 * Client boundaries (the article error page) import AnnouncementBarView
 * directly — importing this file from a client component would pull the whole
 * Payload chain into the client bundle and fail the production build.
 */
export default async function AnnouncementBar() {
  const {
    announcementBadge,
    announcementText,
    announcementHref,
    announcementHidden,
  } = await getHomeContent();

  return (
    <AnnouncementBarView
      badge={announcementBadge}
      text={announcementText}
      href={announcementHref}
      hidden={announcementHidden}
    />
  );
}
