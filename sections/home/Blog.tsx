import BlogCarousel, { type BlogCardPost } from "@/components/home/BlogCarousel";
import { listPublishedPosts, categoryLabel } from "@/lib/posts";

/**
 * Home "Recent blog posts" — server component.
 *
 * Posts are managed in the dashboard (Payload "Posts" collection) and
 * fetched here (published only, newest first). Each card links through to
 * the article at /blogs/[slug]. The carousel UI (arrows + dots) lives in
 * the client `BlogCarousel`. If there are no published posts the section
 * renders nothing rather than showing placeholders.
 */

// Fallback thumbnail for posts that have no hero image set in the CMS.
const FALLBACK_IMAGE = "/assets/figma/blog-2.png";

export default async function Blog() {
  let posts: BlogCardPost[] = [];
  try {
    const rows = await listPublishedPosts({ limit: 8 });
    posts = rows.map((p) => ({
      title: p.title,
      slug: p.slug,
      tag: categoryLabel(p.category),
      image: p.heroImageUrl || FALLBACK_IMAGE,
    }));
  } catch {
    posts = [];
  }

  if (posts.length === 0) return null;

  return (
    <section
      aria-label="Recent blog posts"
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <BlogCarousel posts={posts} />
    </section>
  );
}
