import "server-only";

import { cache } from "react";

import {
  mergeComparison,
  mergeProductCopy,
  mergeShop,
  storedProducts,
  type ComparisonContent,
  type ProductCopy,
  type ShopPageContent,
} from "@/lib/productPageContentTypes";
import { getPayloadInstance } from "@/lib/payload";

/**
 * Server-side reader for the product pages and the shop listing.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders every product page unchanged. The document is
 * read once per request and shared by everything that needs it.
 */

export * from "@/lib/productPageContentTypes";

const readDoc = cache(async (): Promise<Record<string, unknown> | null> => {
  try {
    const payload = await getPayloadInstance();
    return (await payload.findGlobal({
      slug: "product-pages",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
  } catch (err) {
    console.error("[productPageContent] falling back to shipped copy:", err);
    return null;
  }
});

/** The raw stored document, for the editor. */
export async function getProductPagesDoc(): Promise<Record<string, unknown> | null> {
  return readDoc();
}

export async function getProductCopy(
  slug: string,
  productTitle: string,
): Promise<ProductCopy> {
  const doc = await readDoc();
  return mergeProductCopy(storedProducts(doc)[slug], slug, productTitle);
}

export async function getComparison(): Promise<ComparisonContent> {
  return mergeComparison((await readDoc())?.comparison);
}

export async function getShopContent(): Promise<ShopPageContent> {
  return mergeShop((await readDoc())?.shop);
}
