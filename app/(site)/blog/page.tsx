import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import Reveal from "@/components/ui/Reveal";
import PostCard from "@/components/blog/PostCard";
import { listPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — JoodLife",
  description:
    "Stories, science and lifestyle guides on weight loss, GLP-1 medications, nutrition and feeling your best.",
};

export default async function BlogPage() {
  const posts = await listPublishedPosts({ limit: 60 });

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[1440px] px-6 pt-12 pb-8 md:px-[60px] md:pt-16 md:pb-10">
        <Reveal>
          <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/55">
            JoodLife journal
          </p>
          <h1 className="mt-3 font-display text-[40px] font-semibold leading-[44px] tracking-[-0.025em] text-[#142e2a] md:text-[56px] md:leading-[60px]">
            Stories, science &amp;{" "}
            <em className="font-serif italic font-normal">good living.</em>
          </h1>
          <p className="mt-4 max-w-[640px] font-ui text-[16px] leading-[1.6] text-[#142e2a]/75">
            Practical guides on weight loss, GLP-1 medications, nutrition,
            sleep, and the small daily habits that compound.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-16 md:px-[60px] md:pb-24">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-12 text-center">
            <p className="font-ui text-[#142e2a]/70">
              No published posts yet. Sign in to{" "}
              <Link href="/admin/collections/posts" className="underline">
                /admin/collections/posts
              </Link>{" "}
              to write one.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
