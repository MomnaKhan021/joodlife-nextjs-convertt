import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import ProductEditClient from "./ProductEditClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product — JoodLife",
};

/**
 * Shopify-style product add/edit page. `id` of "new" creates a product.
 * Admin-gated; the client fetches/saves via /api/admin-tools/record.
 */
export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin-tools/products/${id}`);
  if (user.role !== "admin") redirect("/");

  return <ProductEditClient id={id} />;
}
