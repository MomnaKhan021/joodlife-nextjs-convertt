import type { GlobalConfig } from "payload";

import { canWriteCms } from "../access/canWriteCms";
import { isPublic } from "../access/isLoggedIn";

/**
 * Page copy for the product pages (/shop/<slug>) and the shop listing.
 *
 * What is sold - name, description, photos, doses, prices - stays on the
 * product in the dashboard. This holds the words around it.
 *
 * Anything missing falls back to lib/pdp-products.ts, so an empty global
 * renders every product page exactly as it ships.
 */
export const ProductPages: GlobalConfig = {
  slug: "product-pages",
  admin: {
    group: "Content",
    description: "Product page copy and the shop heading — edit in /cms/products.",
  },
  access: { read: isPublic, update: canWriteCms("cms-sections") },
  fields: [
    {
      name: "products",
      type: "json",
      admin: { description: "Page copy per product, keyed by the product's slug." },
    },
    {
      name: "usp",
      type: "json",
      admin: { description: "The scrolling trust strip on every product page." },
    },
    {
      name: "comparison",
      type: "json",
      admin: { description: "The comparison table shared by the product pages." },
    },
    { name: "shop", type: "json", admin: { description: "Heading and footnote on /shop." } },
  ],
};

export default ProductPages;
