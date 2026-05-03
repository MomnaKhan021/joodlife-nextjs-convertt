import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

export default function ArticleLoading() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <article className="mx-auto w-full max-w-[840px] px-6 pt-8 pb-4 md:px-0 md:pt-14 md:pb-6">
        <div className="mb-6 h-3 w-48 animate-pulse rounded bg-[#142e2a]/10" />
        <div className="h-6 w-28 animate-pulse rounded-full bg-[#142e2a]/10" />
        <div className="mt-4 h-12 w-[90%] animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-3 h-12 w-[70%] animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-5 h-4 w-[60%] animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-6 flex gap-3">
          <div className="h-3 w-24 animate-pulse rounded bg-[#142e2a]/10" />
          <div className="h-3 w-32 animate-pulse rounded bg-[#142e2a]/10" />
        </div>
      </article>

      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-[60px]">
        <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-[#142e2a]/10" />
      </div>

      <div className="mx-auto w-full max-w-[760px] space-y-4 px-6 pt-10 pb-12 md:px-0 md:pt-14 md:pb-20">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 w-full animate-pulse rounded bg-[#142e2a]/10"
            style={{ width: `${85 + ((i * 7) % 15)}%` }}
          />
        ))}
      </div>

      <Footer />
    </main>
  );
}
