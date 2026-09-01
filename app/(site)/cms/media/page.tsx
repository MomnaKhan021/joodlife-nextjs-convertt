import CmsSectionPage from "../CmsSectionPage";

export const dynamic = "force-dynamic";

export default function CmsMediaPage() {
  return (
    <CmsSectionPage
      title="Media"
      description="Images and file uploads used across the site."
      externalHref="/admin/collections/media"
      externalLabel="Open media library"
    />
  );
}
