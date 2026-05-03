import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

export default function ArticleNotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[760px] flex-1 px-6 py-20 md:py-32">
        <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/55">
          404
        </p>
        <h1 className="mt-3 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px]">
          We couldn&apos;t find that article.
        </h1>
        <p className="mt-4 font-ui text-[16px] leading-[1.6] text-[#142e2a]/70">
          The link may be old or the post may have been unpublished. Browse
          the latest from the journal instead.
        </p>
        <div className="mt-8">
          <Link
            href="/blogs"
            className="inline-flex items-center rounded-full bg-[#142e2a] px-6 py-3 font-ui text-[14px] font-semibold text-white transition hover:bg-[#1d3f3a]"
          >
            Back to journal
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
