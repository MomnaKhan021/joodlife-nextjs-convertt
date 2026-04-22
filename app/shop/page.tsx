import Image from "next/image";
import Link from "next/link";
import { getPayloadInstance } from "@/lib/payload";

// Render fresh every 60s — swap for revalidatePath/updateTag in prod.
export const revalidate = 60;

export const metadata = {
  title: "Shop — JoodLife",
};

type Product = {
  id: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: string;
  images?: Array<{
    image?: {
      url?: string;
      alt?: string;
      sizes?: { card?: { url?: string } };
    };
  }>;
};

export default async function ShopPage() {
  const payload = await getPayloadInstance();
  const { docs: products } = await payload.find({
    collection: "products",
    where: { isActive: { equals: true } },
    sort: "-createdAt",
    limit: 24,
    depth: 2,
  });

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-[60px]">
      <h1 className="font-display text-[36px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px]">
        Shop
      </h1>
      <p className="mt-2 max-w-[560px] font-ui text-[15px] text-[#142e2a]/75 md:text-[16px]">
        Clinically proven weight-loss medications and supplements, delivered
        next-day.
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(products as unknown as Product[]).map((p) => {
          const img = p.images?.[0]?.image;
          const imgUrl = img?.sizes?.card?.url ?? img?.url;

          return (
            <li
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#142e2a]/10 bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(20,46,42,0.08)]"
            >
              <Link
                href={`/shop/${p.slug ?? p.id}`}
                className="flex flex-col gap-4 p-4"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f7f9f2]">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={img?.alt ?? p.title}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="font-display text-[18px] font-bold text-[#142e2a]">
                    {p.title}
                  </h2>
                  <p className="line-clamp-2 font-ui text-[14px] text-[#142e2a]/70">
                    {p.description}
                  </p>
                  <div className="mt-auto flex items-baseline gap-2">
                    <span className="font-display text-[20px] font-semibold text-[#142e2a]">
                      £{p.price.toFixed(2)}
                    </span>
                    {p.comparePrice && p.comparePrice > p.price ? (
                      <span className="font-ui text-[14px] text-[#142e2a]/50 line-through">
                        £{p.comparePrice.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {products.length === 0 ? (
        <p className="mt-10 font-ui text-[#142e2a]/70">
          No products yet. Sign in to{" "}
          <a href="/admin" className="underline">
            /admin
          </a>{" "}
          to add some.
        </p>
      ) : null}
    </main>
  );
}
