import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import Reveal from "@/components/ui/Reveal";
import ShopGrid from "@/components/shop/ShopGrid";
import { listStorefrontProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop — JoodLife",
};

export default async function ShopPage() {
  const products = await listStorefrontProducts();

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* Heading — left aligned, "for you." on second line in italic serif */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pt-12 pb-8 md:px-[60px] md:pt-16 md:pb-10">
        <Reveal>
          <h1 className="font-display text-[40px] font-semibold leading-[44px] tracking-[-0.025em] text-[#142e2a] md:text-[56px] md:leading-[60px]">
            Weight loss solutions
            <br />
            <em className="font-serif italic font-normal">for you.</em>
          </h1>
        </Reveal>
      </section>

      {/* Product grid (desktop) / Swiper (mobile) */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pb-16 md:px-[60px] md:pb-24">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#142e2a]/20 bg-[#f7f9f2] p-12 text-center">
            <p className="font-ui text-[#142e2a]/70">
              No products are configured yet. Sign in to{" "}
              <Link href="/admin" className="underline">
                /admin
              </Link>{" "}
              to add them.
            </p>
          </div>
        ) : (
          <ShopGrid products={products} />
        )}

        <p className="mt-8 font-ui text-[12px] text-[#142e2a]/55 md:mt-10">
          *Prices shown are starting prices. Final cost depends on your
          treatment plan after clinical review.
        </p>
      </section>

      <Footer />
    </main>
  );
}
