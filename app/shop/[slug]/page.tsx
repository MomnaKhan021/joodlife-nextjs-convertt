import Image from "next/image";
import { notFound } from "next/navigation";
import { getPayloadInstance } from "@/lib/payload";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const payload = await getPayloadInstance();

  const { docs } = await payload.find({
    collection: "products",
    where: {
      and: [{ slug: { equals: slug } }, { isActive: { equals: true } }],
    },
    limit: 1,
    depth: 2,
  });

  const product = docs[0];
  if (!product) notFound();

  const img = (product as any).images?.[0]?.image;
  const imgUrl = img?.sizes?.feature?.url ?? img?.url;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-[60px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#f7f9f2]">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={img?.alt ?? product.title}
              fill
              sizes="(max-width: 768px) 90vw, 50vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[44px]">
            {product.title}
          </h1>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[28px] font-bold text-[#142e2a]">
              £{product.price.toFixed(2)}
            </span>
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="font-ui text-[16px] text-[#142e2a]/50 line-through">
                £{product.comparePrice.toFixed(2)}
              </span>
            ) : null}
          </div>
          <p className="font-ui text-[15px] leading-[24px] text-[#142e2a]/80 md:text-[16px]">
            {product.description}
          </p>
          <p className="font-ui text-[13px] text-[#142e2a]/60">
            In stock: {product.stock}
          </p>

          <form
            action="/api/storefront/orders"
            method="post"
            className="mt-4 flex flex-col gap-3"
          >
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className="inline-flex h-[50px] w-fit items-center justify-center rounded-lg bg-[#142e2a] px-10 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
            >
              Buy now
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
