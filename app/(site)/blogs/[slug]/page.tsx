import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import RichText from "@/components/blog/RichText";
import PostCard from "@/components/blog/PostCard";
import EnquiryForm from "@/components/blog/EnquiryForm";
import {
  categoryLabel,
  formatPublishedDate,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: "Article not found — JoodLife",
      description: "The article you're looking for doesn't exist.",
    };
  }
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  return {
    title: `${post.metaTitle ?? post.title} — JoodLife`,
    description,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle ?? post.title,
      description,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: post.heroImageUrl ? "summary_large_image" : "summary",
      title: post.metaTitle ?? post.title,
      description,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post, 3);
  const date = formatPublishedDate(post.publishedAt);

  // JSON-LD structured data — gives Google a clean signal for rich snippets.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    image: post.heroImageUrl ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : undefined,
    articleSection: post.category
      ? categoryLabel(post.category)
      : undefined,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
  };

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <article>
        {/* Breadcrumb + title block */}
        <header className="mx-auto w-full max-w-[840px] px-6 pt-8 pb-4 md:px-0 md:pt-14 md:pb-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 font-ui text-[13px] text-[#142e2a]/60"
          >
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-[#142e2a]">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/blogs" className="hover:text-[#142e2a]">
                  Journal
                </Link>
              </li>
              {post.category ? (
                <>
                  <li aria-hidden>/</li>
                  <li>
                    <Link
                      href={`/blogs?category=${post.category}`}
                      className="hover:text-[#142e2a]"
                    >
                      {categoryLabel(post.category)}
                    </Link>
                  </li>
                </>
              ) : null}
            </ol>
          </nav>

          {post.category ? (
            <span className="inline-flex items-center rounded-full border border-[#142e2a]/15 bg-[#f7f9f2] px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]">
              {categoryLabel(post.category)}
            </span>
          ) : null}

          <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#142e2a] md:text-[52px]">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-5 font-ui text-[18px] leading-[1.55] text-[#142e2a]/75 md:text-[20px]">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 font-ui text-[13px] text-[#142e2a]/65">
            {post.authorName ? (
              <span className="font-semibold text-[#142e2a]">
                {post.authorName}
              </span>
            ) : null}
            {post.authorName && date ? <span aria-hidden>·</span> : null}
            {date ? (
              <time dateTime={post.publishedAt ?? ""}>{date}</time>
            ) : null}
          </div>
        </header>

        {/* Hero image */}
        {post.heroImageUrl ? (
          <div className="mx-auto w-full max-w-[1200px] px-6 md:px-[60px]">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl">
              <Image
                src={post.heroImageUrl}
                alt={post.heroImageAlt ?? post.title}
                fill
                priority
                sizes="(min-width: 1200px) 1140px, 100vw"
                // Show the whole image rather than cropping it to fill 16:9
                // (which cut off the subject's head).
                className="object-contain"
              />
            </div>
          </div>
        ) : null}

        {/* Body */}
        <div className="mx-auto w-full max-w-[760px] px-6 pt-10 pb-12 md:px-0 md:pt-14 md:pb-20">
          {post.bodyHtml ? (
            <div
              className="prose-blog font-ui text-[16px] leading-[1.7] text-[#142e2a]/85 md:text-[17px]"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          ) : (
            <RichText data={post.content} />
          )}

          {post.tags.length > 0 ? (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-[#142e2a]/10 pt-8">
              {post.tags.map((t) => (
                <Link
                  key={t}
                  href={`/blogs?category=${encodeURIComponent(post.category ?? "other")}`}
                  className="rounded-full bg-[#f7f9f2] px-3 py-1 font-ui text-[12px] text-[#142e2a]/75 transition hover:bg-[#142e2a] hover:text-white"
                >
                  #{t}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-10">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 font-ui text-[14px] font-semibold text-[#142e2a]"
            >
              ← Back to journal
            </Link>
          </div>
        </div>
      </article>

      {/* Enquiry — ask a question about this article (goes to HubSpot) */}
      <section aria-label="Send an enquiry" className="mx-auto w-full max-w-[760px] px-6 pb-4 md:px-0">
        <EnquiryForm source={`https://joodlife.shop/blogs/${post.slug}`} />
      </section>

      {/* Related */}
      {related.length > 0 ? (
        <section
          aria-labelledby="related-heading"
          className="border-t border-[#142e2a]/10 bg-[#f7f9f2]/40"
        >
          <div className="mx-auto w-full max-w-[1440px] px-6 py-14 md:px-[60px] md:py-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <h2
                id="related-heading"
                className="font-display text-[26px] font-semibold tracking-[-0.01em] text-[#142e2a] md:text-[34px]"
              >
                More from the journal
              </h2>
              <Link
                href="/blogs"
                className="font-ui text-[14px] font-semibold text-[#142e2a]/80 transition hover:text-[#142e2a]"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <PostCard key={r.id} post={r} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Footer />

      {/* SEO: Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
