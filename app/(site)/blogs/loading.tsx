import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

/**
 * Streaming skeleton for /blogs and any of its child segments while
 * the server fetches posts. Matches the real layout's vertical rhythm
 * so there's no jump when the data lands.
 */
export default function BlogsLoading() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[1440px] px-6 pt-10 pb-6 md:px-[60px] md:pt-16 md:pb-8">
        <div className="h-3 w-32 animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-4 h-12 w-[80%] max-w-[640px] animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-3 h-12 w-[55%] max-w-[460px] animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-6 h-4 w-[60%] max-w-[600px] animate-pulse rounded bg-[#142e2a]/10" />
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-[#142e2a]/10"
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-10 md:px-[60px] md:pb-14">
        <div className="grid overflow-hidden rounded-3xl border border-[#142e2a]/10 md:grid-cols-2">
          <div className="aspect-[4/3] w-full animate-pulse bg-[#142e2a]/10 md:aspect-auto md:min-h-[420px]" />
          <div className="space-y-4 p-7 md:p-10">
            <div className="h-3 w-28 animate-pulse rounded bg-[#142e2a]/10" />
            <div className="h-8 w-[80%] animate-pulse rounded bg-[#142e2a]/10" />
            <div className="h-8 w-[60%] animate-pulse rounded bg-[#142e2a]/10" />
            <div className="h-3 w-full animate-pulse rounded bg-[#142e2a]/10" />
            <div className="h-3 w-[90%] animate-pulse rounded bg-[#142e2a]/10" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-16 md:px-[60px] md:pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-[#142e2a]/10"
            >
              <div className="aspect-[4/3] animate-pulse bg-[#142e2a]/10" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-[80%] animate-pulse rounded bg-[#142e2a]/10" />
                <div className="h-3 w-full animate-pulse rounded bg-[#142e2a]/10" />
                <div className="h-3 w-[70%] animate-pulse rounded bg-[#142e2a]/10" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
