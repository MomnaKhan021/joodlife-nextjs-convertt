import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import OrderDetailClient from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order — JoodLife",
};

/**
 * Shopify-style order detail page. Admin-gated; the client component
 * fetches the order via /api/admin-tools/record and renders the layout.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin-tools/orders/${id}`);
  if (user.role !== "admin") redirect("/");

  return <OrderDetailClient id={id} />;
}
