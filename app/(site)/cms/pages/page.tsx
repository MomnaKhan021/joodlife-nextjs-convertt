import CmsSectionPage from "../CmsSectionPage";

export const dynamic = "force-dynamic";

export default function CmsPagesPage() {
  return (
    <CmsSectionPage
      title="Pages"
      description="Create site pages with rich text or raw HTML."
      externalHref="/admin/collections/pages"
      externalLabel="Open page editor"
      note="Give the page a title and slug, write the body in the rich text editor (or paste raw HTML under the advanced section), then set status to Published. It goes live at /<slug> immediately — no deploy needed."
    />
  );
}
