import { PDP_PRODUCTS } from "@/lib/pdp-products";
import {
  mergeComparison,
  mergeProductCopy,
  mergeShop,
  storedProducts,
} from "@/lib/productPageContentTypes";
import { listStorefrontProducts } from "@/lib/products";

import { LoadFailed, loadGlobal } from "../loadGlobal";
import ProductsForm, { type ProductTab } from "./ProductsForm";

export const dynamic = "force-dynamic";

export default async function CmsProductsPage() {
  const [doc, sold] = await Promise.all([
    loadGlobal("product-pages"),
    listStorefrontProducts(),
  ]);
  if (!doc) return <LoadFailed what="product pages" />;

  // Every product with a page: those in the dashboard, plus any that only
  // have shipped copy (their page still renders from it).
  const tabs: ProductTab[] = sold.map((p) => ({ slug: p.slug, title: p.title }));
  for (const [slug, p] of Object.entries(PDP_PRODUCTS)) {
    if (!tabs.some((t) => t.slug === slug)) tabs.push({ slug, title: p.title });
  }

  const stored = storedProducts(doc);
  const copies = Object.fromEntries(
    tabs.map((t) => [t.slug, mergeProductCopy(stored[t.slug], t.slug, t.title)]),
  );

  return (
    <ProductsForm
      tabs={tabs.map((t) => ({ ...t, hasShippedCopy: !!PDP_PRODUCTS[t.slug] }))}
      initialCopies={copies}
      initialComparison={mergeComparison(doc.comparison)}
      initialShop={mergeShop(doc.shop)}
      // A product saved before but not listed now (say, switched off in the
      // dashboard) is written back exactly as it was found.
      untouched={Object.fromEntries(
        Object.entries(stored).filter(([slug]) => !tabs.some((t) => t.slug === slug)),
      )}
    />
  );
}
