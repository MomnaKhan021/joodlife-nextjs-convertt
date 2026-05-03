import Link from "next/link";
import { notFound } from "next/navigation";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import RichText from "@/components/blog/RichText";
import {
  categoryLabel,
  formatPublishedDate,
  getPostBySlug,
  listPublishedPosts,
} from "@/lib/posts";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found — JoodLife" };
  return {
    title: `${post.metaTitle ?? post.title} — JoodLife`,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const date = formatPublishedDate(post.publishedAt);
  const related = (await listPublishedPosts({ limit: 4 })).filter(
    (p) => p.id !== post.id
  );

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* Article header */}
      <article className="mx-auto w-full max-w-[820px] px-6 pt-10 pb-12 md:pt-16 md:pb-20">
        <nav className="mb-6 font-ui text-[13px] text-[#142e2a]/60">
          <Link href="/blog" className="hover:text-[#142e2a]">
            ← Back to journal
          </Link>
        </nav>

        <header>
          {post.category ? (
            <span className="inline-flex items-center rounded-full border border-[#142e2a]/15 bg-[#f7f9f2] px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]">
              {categoryLabel(post.category)}
            </span>
          ) : null}
          <h1 className="mt-4 font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#142e2a] md:text-[48px]">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-4 font-ui text-[18px] leading-[1.55] text-[#142e2a]/75 md:text-[20px]">
              {post.excerpt}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3 font-ui text-[13px] text-[#142e2a]/65">
            {post.authorName ? <span>{post.authorName}</span> : null}
            {post.authorName && date ? <span aria-hidden>·</span> : null}
            {date ? <time dateTime={post.publishedAt ?? ""}>{date}</time> : null}
          </div>
        </header>

        {post.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.heroImageUrl}
            alt={post.heroImageAlt ?? post.title}
            className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover"
          />
        ) : null}

        <div className="mt-10">
          {post.bodyHtml ? (
            <div
              className="prose-blog font-ui text-[16px] leading-[1.7] text-[#142e2a]/85 md:text-[17px]"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          ) : (
            <RichText data={post.content} />
          )}
        </div>

        {post.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-[#142e2a]/10 pt-6">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#f7f9f2] px-3 py-1 font-ui text-[12px] text-[#142e2a]/75"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </article>

      {related.length > 0 ? (
        <section className="border-t border-[#142e2a]/10 bg-[#f7f9f2]/40">
          <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-[60px] md:py-16">
            <h2 className="mb-6 font-display text-[24px] font-semibold tracking-[-0.01em] text-[#142e2a] md:text-[28px]">
              More from the journal
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="block rounded-xl border border-[#142e2a]/10 bg-white p-4 transition hover:border-[#142e2a]/30"
                  >
                    <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/55">
                      {categoryLabel(r.category)}
                    </p>
                    <h3 className="mt-2 font-display text-[17px] font-semibold leading-[1.25] text-[#142e2a]">
                      {r.title}
                    </h3>
                    {r.excerpt ? (
                      <p className="mt-2 line-clamp-2 font-ui text-[13px] text-[#142e2a]/65">
                        {r.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  );
}
