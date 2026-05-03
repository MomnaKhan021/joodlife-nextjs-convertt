import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import ShopifyImportClient from "./ShopifyImportClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shopify Import — JoodLife",
};

/**
 * Admin-only Shopify blog importer.
 *
 * Pulls articles (title, slug, body HTML, hero image, tags, published
 * date) from a Shopify blog into our Payload `posts` collection.
 * Idempotent — re-running updates existing rows by shopify_article_id
 * instead of duplicating.
 */
export default async function ShopifyImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/shopify-import");
  if (user.role !== "admin") redirect("/");

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-[60px] md:py-16">
      <div className="mb-8">
        <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
          Admin tools
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
          Import blog from Shopify
        </h1>
        <p className="mt-3 max-w-[680px] font-ui text-[15px] text-[#142e2a]/75">
          Pull articles from your existing Shopify blog into JoodLife&apos;s
          posts collection. Two methods:{" "}
          <strong>Public feed</strong> (no setup, just paste your store URL)
          or <strong>Custom app</strong> (advanced — needs a Shopify token,
          but lets you import drafts too). Re-running the import is always
          safe — articles are matched by their Shopify ID and updated in
          place.
        </p>
      </div>

      <ShopifyImportClient />
    </main>
  );
}
