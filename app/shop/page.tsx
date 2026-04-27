import Image from "next/image";
import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import Reveal from "@/components/ui/Reveal";
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

      {/* Hero / intro — matches home-page section typography */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pt-12 pb-8 text-center md:px-[60px] md:pt-20 md:pb-12">
        <Reveal>
          <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.18em] text-[#142e2a]/60">
            Treatments
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-3 font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-[#142e2a] md:text-[56px] md:leading-[60px]">
            Weight loss solutions{" "}
            <em className="font-serif italic font-normal">for you</em>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-4 max-w-[640px] font-ui text-[15px] leading-[22px] text-[#142e2a]/75 md:text-[16px] md:leading-[26px]">
            Clinically proven treatments, prescribed online, delivered next-day.
            Every plan is reviewed by a UK-licensed clinician before dispatch.
          </p>
        </Reveal>
      </section>

      {/* Product grid */}
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
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
            {products.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 120}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#142e2a]/10 bg-[#f7f9f2] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(20,46,42,0.10)]">
                  {p.badge ? (
                    <span className="absolute left-4 top-4 z-10 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_4px_12px_rgba(20,46,42,0.18)]">
                      {p.badge}
                    </span>
                  ) : null}

                  <Link
                    href={`/shop/${p.slug}`}
                    className="flex flex-1 flex-col gap-5 p-5 md:p-6"
                  >
                    {/* Image tile */}
                    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl bg-white">
                      {p.heroImageUrl ? (
                        <Image
                          src={p.heroImageUrl}
                          alt={p.title}
                          fill
                          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
                          className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      ) : null}
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col gap-3">
                      {/* Active-ingredient pill (tagline) */}
                      {p.tagline ? (
                        <span className="inline-flex w-fit items-center rounded-full border border-[#142e2a]/15 bg-white px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-[#142e2a]/70">
                          {p.tagline}
                        </span>
                      ) : null}

                      {/* Title */}
                      <h2 className="font-display text-[28px] font-semibold leading-[32px] tracking-[-0.02em] text-[#142e2a] md:text-[32px] md:leading-[36px]">
                        {p.title}
                      </h2>

                      {/* Description */}
                      <p className="line-clamp-3 font-ui text-[14px] leading-[21px] text-[#142e2a]/75 md:text-[15px] md:leading-[22px]">
                        {p.description}
                      </p>

                      {/* Price */}
                      {p.fromPrice !== null ? (
                        <p className="mt-auto pt-3 font-ui text-[13px] text-[#142e2a]/65 md:text-[14px]">
                          Starting from{" "}
                          <span className="font-display text-[20px] font-semibold text-[#142e2a] md:text-[22px]">
                            £{p.fromPrice.toFixed(2)}
                          </span>
                          /month*
                        </p>
                      ) : null}
                    </div>
                  </Link>

                  {/* CTA */}
                  <div className="px-5 pb-5 md:px-6 md:pb-6">
                    <Link
                      href={`/shop/${p.slug}`}
                      className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors duration-200 hover:bg-[#0c2421]"
                    >
                      Get started
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center font-ui text-[12px] text-[#142e2a]/55 md:mt-10">
          *Prices shown are starting prices. Final cost depends on your
          treatment plan after clinical review.
        </p>
      </section>

      <Footer />
    </main>
  );
}
