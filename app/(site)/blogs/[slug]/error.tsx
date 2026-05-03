"use client";

import Link from "next/link";
import { useEffect } from "react";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

/**
 * Article-page error boundary. Surfaces when getPostBySlug throws or
 * when rendering the body crashes (e.g. malformed Lexical JSON).
 * notFound() is handled by Next's not-found.tsx — this is for true errors.
 */
export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[blogs/[slug]] render error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[760px] flex-1 px-6 py-20 md:py-32">
        <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/55">
          Something went wrong
        </p>
        <h1 className="mt-3 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px]">
          We couldn&apos;t load this article.
        </h1>
        <p className="mt-4 font-ui text-[16px] leading-[1.6] text-[#142e2a]/70">
          The page hit an unexpected error while rendering. You can try
          again, or head back to the journal.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-full bg-[#142e2a] px-6 py-3 font-ui text-[14px] font-semibold text-white transition hover:bg-[#1d3f3a]"
          >
            Try again
          </button>
          <Link
            href="/blogs"
            className="inline-flex items-center rounded-full border border-[#142e2a]/20 px-6 py-3 font-ui text-[14px] font-semibold text-[#142e2a] transition hover:border-[#142e2a]/40"
          >
            Back to journal
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-8 font-mono text-[11px] text-[#142e2a]/40">
            Error reference: {error.digest}
          </p>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
