import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import CustomerDetailClient from "./CustomerDetailClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer — JoodLife",
};

/**
 * Admin customer detail page. Keyed by (URL-encoded) email — orders carry the
 * email, so this reliably resolves a customer's full history. Admin-gated;
 * the client fetches /api/admin-tools/customer?email=… and renders.
 */
export default async function CustomerPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: raw } = await params;
  const email = decodeURIComponent(raw);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin-tools/customers/${encodeURIComponent(raw)}`);
  if (user.role !== "admin" && user.role !== "staff") redirect("/");

  return <CustomerDetailClient email={email} />;
}
