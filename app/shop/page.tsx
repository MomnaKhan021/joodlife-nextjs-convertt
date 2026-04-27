import Image from "next/image";
import Link from "next/link";

import { listStorefrontProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop — JoodLife",
};

export default async function ShopPage() {
  const products = await listStorefrontProducts();

  return (
    <main className="bg-[#f7f9f2]">
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-12 pb-8 text-center md:px-[60px] md:pt-20 md:pb-12">
        <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.18em] text-[#142e2a]/60">
          Treatments
        </p>
        <h1 className="mt-3 font-display text-[36px] font-semibold leading-[42px] tracking-[-0.025em] text-[#142e2a] md:text-[56px] md:leading-[60px]">
          Weight loss solutions{" "}
          <em className="font-serif italic font-normal">for you</em>
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] font-ui text-[15px] leading-[22px] text-[#142e2a]/75 md:text-[16px] md:leading-[26px]">
          Clinically proven treatments, prescribed online, delivered next-day.
          Every plan is reviewed by a UK-licensed clinician before dispatch.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-6 pb-16 md:px-[60px] md:pb-24">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#142e2a]/20 bg-white p-12 text-center">
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
            {products.map((p) => (
              <li
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#142e2a]/10 bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(20,46,42,0.08)]"
              >
                {p.badge ? (
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                    {p.badge}
                  </span>
                ) : null}
                <Link
                  href={`/shop/${p.slug}`}
                  className="flex flex-1 flex-col gap-5 p-5 md:p-6"
                >
                  <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f7f9f2]">
                    {p.heroImageUrl ? (
                      <Image
                        src={p.heroImageUrl}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
                        className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#142e2a]">
                        {p.title}
                      </h2>
                      {p.tagline ? (
                        <span className="font-ui text-[12px] uppercase tracking-[0.08em] text-[#142e2a]/55">
                          {p.tagline}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-3 font-ui text-[14px] leading-[21px] text-[#142e2a]/70">
                      {p.description}
                    </p>

                    {p.fromPrice !== null ? (
                      <p className="mt-auto pt-3 font-ui text-[14px] text-[#142e2a]/65">
                        Starting from{" "}
                        <span className="font-display text-[20px] font-semibold text-[#142e2a]">
                          £{p.fromPrice.toFixed(2)}
                        </span>
                        /month*
                      </p>
                    ) : null}
                  </div>
                </Link>

                <div className="px-5 pb-5 md:px-6 md:pb-6">
                  <Link
                    href={`/shop/${p.slug}`}
                    className="inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
                  >
                    Get started
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center font-ui text-[12px] text-[#142e2a]/55">
          *Prices shown are starting prices. Final cost depends on your
          treatment plan after clinical review.
        </p>
      </section>
    </main>
  );
}
