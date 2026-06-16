import { redirect } from "next/navigation";

/**
 * /products/<slug> — legacy / Shopify-style product URL.
 *
 * The product detail page lives at /shop/<slug>. The live joodlife.com
 * (Shopify) used /products/<handle>, and inbound links / habit still hit
 * those, so we redirect them to the canonical PDP. A plain redirect always
 * builds and works (no importing of the page module), and preserves any
 * inbound links to the old URLs.
 */
export const dynamic = "force-dynamic";

export default async function LegacyProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/shop/${slug}`);
}
