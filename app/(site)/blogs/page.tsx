import Image from "next/image";
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
    title: `Jood wellness library${titlePart}${pagePart} — JoodLife`,
    description:
      "Explore expert tips and proven advice to support your weight loss and wellbeing goals. Learn how to create a healthier lifestyle that truly lasts.",
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1400px] items-center overflow-hidden rounded-[24px] md:min-h-[560px]">
          <Image
            src="/assets/figma/blog/hero.png"
            alt="A runner training outdoors at golden hour"
            fill
            priority
            sizes="(min-width: 1440px) 1400px, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#0c1f1c]/80 via-[#0c1f1c]/45 to-[#0c1f1c]/20 md:from-[#0c1f1c]/70 md:via-[#0c1f1c]/35"
          />
          <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-10">
            <Reveal className="max-w-[600px]">
              <h1 className="font-display text-[40px] font-semibold leading-[1.06] tracking-[-0.02em] text-white md:text-[60px]">
                Jood wellness{" "}
                <em className="font-serif font-normal italic">library</em>
              </h1>
              <p className="mt-4 max-w-[520px] font-ui text-[15px] leading-[1.55] text-white/85 md:text-[16px]">
                Explore expert tips and proven advice to support your weight
                loss and wellbeing goals. Learn how to create a healthier
                lifestyle that truly lasts.
              </p>
              <Link
                href="/consultation"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-ui text-[15px] font-semibold text-[#142e2a] transition hover:bg-[#dff49f]"
              >
                Am I eligible?
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Recent blog posts ────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-14 pb-8 md:px-[60px] md:pt-24 md:pb-12">
        <Reveal className="mx-auto max-w-[720px] text-center">
          <h2 className="font-display text-[26px] font-bold tracking-[-0.01em] text-[#142e2a] md:text-[32px]">
            Recent blog posts
          </h2>
          <p className="mx-auto mt-3 max-w-[680px] font-ui text-[15px] leading-[1.55] text-[#142e2a]/70 md:text-[16px]">
            Explore expert tips and proven advice to support your weight loss
            and wellbeing goals. Learn how to create a healthier lifestyle that
            truly lasts.
          </p>
        </Reveal>

        <div className="mt-8 md:mt-10">
          <CategoryTabs
            categories={categories}
            active={category}
            basePath={BASE_PATH}
          />
        </div>
      </section>

      {/* Featured post (page 1, no filter) */}
      {featured ? (
        <section className="mx-auto w-full max-w-[1440px] px-4 pb-6 md:px-[60px] md:pb-8">
          <PostCard post={featured} variant="feature" priority />
        </section>
      ) : null}

      {/* Grid */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-[60px] md:pb-24">
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
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
                {total} {total === 1 ? "article" : "articles"}
                {category ? ` in ${category.replace(/-/g, " ")}` : ""}
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* ── Newsletter ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 md:px-[60px] md:pb-24">
        <Reveal className="grid items-stretch gap-6 overflow-hidden md:grid-cols-2 md:gap-10">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-[#f7f9f2] md:aspect-auto md:min-h-[380px]">
            <Image
              src="/assets/figma/blog/newsletter.png"
              alt="A woman checking her phone in a bright kitchen"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.01em] text-[#142e2a] md:text-[44px]">
              Stay updated with results{" "}
              <em className="font-serif font-normal italic">
                and expert insights
              </em>
            </h2>
            <p className="mt-5 font-ui text-[14px] font-semibold text-[#142e2a]">
              Subscribe for a newsletter
            </p>
            <p className="mt-2 max-w-[440px] font-ui text-[15px] leading-[1.55] text-[#142e2a]/70">
              Get expert advice, treatment updates, and inspiring transformation
              stories sent to your inbox.
            </p>

            <form
              action="/consultation"
              method="get"
              className="mt-6 flex flex-col gap-3"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Your email
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                placeholder="Your email here"
                className="w-full rounded-full border border-[#142e2a]/15 bg-[#f7f9f2] px-5 py-3.5 font-ui text-[15px] text-[#142e2a] outline-none transition placeholder:text-[#142e2a]/45 focus:border-[#142e2a]/50"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-[#142e2a] px-6 py-3.5 font-ui text-[15px] font-semibold text-white transition hover:bg-[#1d3f3a]"
              >
                Submit
              </button>
            </form>
          </div>
        </Reveal>
      </section>

      {/* ── "Feel Better" CTA banner ─────────────────────────── */}
      <section className="px-4 pb-16 md:px-6 md:pb-24">
        <div className="relative mx-auto flex min-h-[360px] w-full max-w-[1320px] items-center justify-center overflow-hidden rounded-[24px] md:min-h-[500px]">
          <Image
            src="/assets/figma/blog/cta-banner.png"
            alt="A woman relaxing at home"
            fill
            sizes="(min-width: 1440px) 1320px, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[#0c1f1c]/35"
          />
          <Reveal className="relative z-10 flex flex-col items-center px-6 text-center">
            <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[54px]">
              Feel Better.
              <br />
              Start Treatment Today
            </h2>
            <p className="mt-4 font-ui text-[16px] text-white/85 md:text-[18px]">
              Customised care starts here
            </p>
            <Link
              href="/consultation"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-ui text-[15px] font-semibold text-[#142e2a] transition hover:bg-[#dff49f]"
            >
              Get started
            </Link>
          </Reveal>
        </div>
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
            <Link href="/admin/collections/posts" className="underline">
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
