import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
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
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "products",
      type: "json",
      admin: { description: "Page copy per product, keyed by the product's slug." },
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
