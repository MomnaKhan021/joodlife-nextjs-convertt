import Image from "next/image";
import { notFound } from "next/navigation";
import { getPayloadInstance } from "@/lib/payload";
import VariantSelector, { type Variant } from "./VariantSelector";

export const dynamic = "force-dynamic";

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

  const product = docs[0] as any;
  if (!product) notFound();

  const images: Array<{ url?: string; alt?: string }> =
    (product.images ?? [])
      .map((row: any) => row?.image)
      .filter(Boolean)
      .map((img: any) => ({
        url: img?.sizes?.feature?.url ?? img?.url,
        alt: img?.alt,
      }));

  const heroImg = images[0];
  const variants = (product.variants ?? []) as Variant[];

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-[60px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#f7f9f2]">
            {heroImg?.url ? (
              <Image
                src={heroImg.url}
                alt={heroImg.alt ?? product.title}
                fill
                sizes="(max-width: 768px) 90vw, 50vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, i) =>
                img.url ? (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f9f2]"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? product.title}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                ) : null
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[44px]">
              {product.title}
            </h1>
            <p className="mt-2 font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/60">
              {product.category}
            </p>
          </div>

          <p className="font-ui text-[15px] leading-[24px] text-[#142e2a]/80 md:text-[16px]">
            {product.description}
          </p>

          <VariantSelector
            productId={product.id}
            variants={variants}
            fallbackPrice={product.price}
            fallbackComparePrice={product.comparePrice}
          />
        </div>
      </div>
    </main>
  );
}
