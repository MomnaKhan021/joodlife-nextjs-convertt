import CmsSectionPage from "../CmsSectionPage";

export const dynamic = "force-dynamic";

export default function CmsBlogsPage() {
  return (
    <CmsSectionPage
      title="Blog posts"
      description="Write and publish articles for /blogs."
      externalHref="/admin/collections/posts"
      externalLabel="Open blog editor"
      note="Posts are fully CMS-managed already: title, slug, hero image, rich text body, category, tags, author, SEO and draft/publish. Published posts appear at /blogs without a redeploy."
    />
  );
}
