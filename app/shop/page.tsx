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

/**
 * Per-product card overrides. Each joodlife.com card uses the brand
 * colour baked into the product image as its full backdrop, with a
 * darker variant of that colour for the bottom price/CTA strip and a
 * 1–2 sentence "card" copy that's tighter than the SEO description.
 *
 * The hex values approximate the colours sampled from joodlife.com's
 * production images.
 */
const CARD_THEMES: Record<
  string,
  { footerBg: string; cardCopy: string }
> = {
  mounjaro: {
    footerBg: "#3a2350",
    cardCopy:
      "Our most advanced weight-loss option. Supports appetite control and long-term results.",
  },
  wegovy: {
    footerBg: "#2e3030",
    cardCopy: "Once-weekly appetite control. Supports steady weight loss.",
  },
  saxenda: {
    footerBg: "#3f5675",
    cardCopy: "Clinician-prescribed treatment to help reduce appetite.",
  },
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
            {products.map((p, i) => {
              const theme = CARD_THEMES[p.slug] ?? {
                footerBg: "#142e2a",
                cardCopy: p.description,
              };
              return (
                <Reveal as="li" key={p.id} delay={i * 120}>
                  <article className="group relative flex aspect-[4/5] w-full overflow-hidden rounded-3xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(20,46,42,0.16)]">
                    {/* Full-bleed product image — its baked-in colour
                        becomes the card backdrop */}
                    {p.heroImageUrl ? (
                      <Image
                        src={p.heroImageUrl}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
                        className="object-cover object-right transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        priority={i === 0}
                      />
                    ) : null}

                    {/* Top-left content stack */}
                    <div className="relative z-10 flex flex-1 flex-col gap-3 p-5 pr-2 md:p-6 md:pr-3">
                      {/* Active-ingredient pill */}
                      {p.tagline ? (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-ui text-[12px] font-medium text-[#142e2a] shadow-[0_2px_6px_rgba(20,46,42,0.06)] backdrop-blur-sm">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full bg-[#3aa55a]"
                          />
                          {p.tagline}
                        </span>
                      ) : null}

                      {/* Title */}
                      <h2 className="font-display text-[22px] font-bold leading-[26px] tracking-[-0.01em] text-[#142e2a] md:text-[24px] md:leading-[28px]">
                        {p.title}
                      </h2>

                      {/* Short card copy */}
                      <p className="max-w-[55%] font-ui text-[13px] leading-[19px] text-[#142e2a]/85 md:text-[14px] md:leading-[20px]">
                        {theme.cardCopy}
                      </p>
                    </div>

                    {/* Optional badge top-right (e.g. "Best seller") */}
                    {p.badge ? (
                      <span className="absolute right-4 top-4 z-10 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_4px_12px_rgba(20,46,42,0.18)]">
                        {p.badge}
                      </span>
                    ) : null}

                    {/* Bottom strip: price (left) + Get Started (right) */}
                    <div
                      className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 px-5 py-3.5 md:px-6 md:py-4"
                      style={{ backgroundColor: theme.footerBg }}
                    >
                      <span className="font-ui text-[13px] font-semibold text-white md:text-[14px]">
                        {p.fromPrice !== null
                          ? `Starting from £${p.fromPrice.toFixed(0)}/month*`
                          : "Starting from /month*"}
                      </span>
                      <Link
                        href={`/shop/${p.slug}`}
                        className="inline-flex h-[34px] items-center justify-center rounded-full bg-white px-4 font-ui text-[12px] font-semibold text-[#142e2a] transition-colors duration-200 hover:bg-[#f7f9f2] md:h-[38px] md:px-5 md:text-[13px]"
                      >
                        Get Started
                      </Link>
                    </div>

                    {/* Whole-card click target — sits behind the CTA */}
                    <Link
                      href={`/shop/${p.slug}`}
                      aria-label={`Open ${p.title}`}
                      className="absolute inset-0 z-0"
                    />
                  </article>
                </Reveal>
              );
            })}
          </ul>
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
