/**
 * /products/[slug] — alias of the product detail page that lives at
 * /shop/[slug]. The live joodlife.com (Shopify) used /products/<handle>
 * URLs, and people expect them here too, so we serve the exact same PDP
 * from this path by re-exporting the /shop/[slug] page. Existing /shop
 * links keep working unchanged.
 */
export {
  default,
  generateStaticParams,
  dynamic,
} from "../../shop/[slug]/page";
