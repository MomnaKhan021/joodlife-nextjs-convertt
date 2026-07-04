import BlogCarousel, { type BlogCardPost } from "@/components/home/BlogCarousel";
import { listPublishedPosts, categoryLabel } from "@/lib/posts";

/**
 * Home "Recent blog posts" — server component.
 *
 * Posts are managed in the dashboard (Payload "Posts" collection) and
 * fetched here (published only, newest first). Each card links through to
 * the article at /blogs/[slug]. The carousel UI (arrows + dots) lives in
 * the client `BlogCarousel`.
 *
 * When the CMS has no published posts yet, we show a small set of demo
 * cards (linking to the /blogs index) so the section still renders the
 * Figma design — real posts replace these automatically once published.
 */

// Fallback thumbnail for posts that have no hero image set in the CMS.
const FALLBACK_IMAGE = "/assets/figma/blog-2.png";

// Shown only until the dashboard has published posts. These link to the
// blog index (not a specific article) so nothing 404s.
const DEMO_POSTS: BlogCardPost[] = [
  {
    title: "How Weight Loss Medications Are Changing Everyday Lives",
    href: "/blogs",
    tag: "Jood Updates",
    image: "/assets/figma/quiz-overlay.png",
  },
  {
    title: "The Science Behind GLP-1 and Sustainable Results",
    href: "/blogs",
    tag: "Science",
    image: "/assets/figma/blog-2.png",
  },
  {
    title: "Daily Habits That Accelerate Your Weight Loss Journey",
    href: "/blogs",
    tag: "Lifestyle",
    image: "/assets/figma/blog-3.png",
  },
  {
    title: "Mindful Eating: Small Shifts With Big Impact",
    href: "/blogs",
    tag: "Nutrition",
    image: "/assets/figma/quiz-overlay.png",
  },
];

export default async function Blog() {
  let posts: BlogCardPost[] = [];
  try {
    const rows = await listPublishedPosts({ limit: 8 });
    posts = rows.map((p) => ({
      title: p.title,
      href: `/blogs/${p.slug}`,
      tag: categoryLabel(p.category),
      image: p.heroImageUrl || FALLBACK_IMAGE,
    }));
  } catch {
    posts = [];
  }

  // No published posts yet → show the designed section with demo cards.
  if (posts.length === 0) posts = DEMO_POSTS;

  return (
    <section
      aria-label="Recent blog posts"
      className="w-full bg-white py-12 md:py-14 lg:py-[56px]"
    >
      <BlogCarousel posts={posts} />
    </section>
  );
}
