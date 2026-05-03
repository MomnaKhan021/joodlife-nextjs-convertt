import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import Reveal from "@/components/ui/Reveal";
import PostCard from "@/components/blog/PostCard";
import CategoryTabs from "@/components/blog/CategoryTabs";
import Pagination from "@/components/blog/Pagination";
import {
  getCategoryCounts,
  listPublishedPostsPaginated,
} from "@/lib/posts";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;
const BASE_PATH = "/blogs";

type SearchParams = { page?: string; category?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = sp.category?.trim() || null;
  const titlePart = category ? ` · ${category.replace(/-/g, " ")}` : "";
  const pagePart = page > 1 ? ` · Page ${page}` : "";
  return {
    title: `Journal${titlePart}${pagePart} — JoodLife`,
    description:
      "Practical guides on weight loss, GLP-1 medications, nutrition, sleep, and the small daily habits that compound.",
    alternates: { canonical: page > 1 || category ? undefined : "/blogs" },
  };
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const category = sp.category?.trim() || null;
  const offset = (page - 1) * PAGE_SIZE;

  // Fire both in parallel — counts feed the category tabs, posts feed the grid.
  const [paginated, categories] = await Promise.all([
    listPublishedPostsPaginated({
      limit: PAGE_SIZE,
      offset,
      category,
    }),
    getCategoryCounts(),
  ]);

  const { posts, total, totalPages } = paginated;
  const isFiltered = !!category;
  const showFeatured = !isFiltered && page === 1 && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const grid = showFeatured ? posts.slice(1) : posts;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* Page header */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pt-10 pb-6 md:px-[60px] md:pt-16 md:pb-8">
        <Reveal>
          <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/55">
            JoodLife journal
          </p>
          <h1 className="mt-3 font-display text-[40px] font-semibold leading-[44px] tracking-[-0.025em] text-[#142e2a] md:text-[60px] md:leading-[64px]">
            Stories, science &amp;{" "}
            <em className="font-serif italic font-normal">good living.</em>
          </h1>
          <p className="mt-4 max-w-[640px] font-ui text-[16px] leading-[1.6] text-[#142e2a]/75">
            Practical guides on weight loss, GLP-1 medications, nutrition,
            sleep, and the small daily habits that compound.
          </p>
        </Reveal>

        <div className="mt-8">
          <CategoryTabs
            categories={categories}
            active={category}
            basePath={BASE_PATH}
            totalCount={
              category
                ? categories.reduce((s, c) => s + c.count, 0)
                : total
            }
          />
        </div>
      </section>

      {/* Featured post (page 1, no filter) */}
      {featured ? (
        <section className="mx-auto w-full max-w-[1440px] px-6 pb-10 md:px-[60px] md:pb-14">
          <PostCard post={featured} variant="feature" priority />
        </section>
      ) : null}

      {/* Grid */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pb-16 md:px-[60px] md:pb-24">
        {posts.length === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          <>
            {grid.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((p, i) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    priority={!showFeatured && i < 3}
                  />
                ))}
              </div>
            ) : null}

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath={BASE_PATH}
              category={category}
            />

            {total > 0 ? (
              <p className="mt-6 text-center font-ui text-[12px] text-[#142e2a]/55">
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}{" "}
                {total === 1 ? "article" : "articles"}
                {category ? ` in ${category.replace(/-/g, " ")}` : ""}
              </p>
            ) : null}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-12 text-center">
      <p className="font-ui text-[#142e2a]/70">
        {filtered ? (
          <>
            No articles in this category yet.{" "}
            <Link href={BASE_PATH} className="underline">
              Show everything
            </Link>
            .
          </>
        ) : (
          <>
            No published articles yet. Sign in to{" "}
            <Link
              href="/admin/collections/posts"
              className="underline"
            >
              /admin/collections/posts
            </Link>{" "}
            to write one.
          </>
        )}
      </p>
    </div>
  );
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 1000);
}
