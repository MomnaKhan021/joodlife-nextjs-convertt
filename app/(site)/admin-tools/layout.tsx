import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

/**
 * Shared chrome for every /admin-tools page: a Shopify-style left sidebar
 * + content area. Admin-gated centrally here so each page doesn't need to.
 */
export default async function AdminToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools");
  // Admins see everything; staff (e.g. analysts) may only open the
  // analytics dashboard — every other page double-checks for "admin"
  // server-side and redirects staff to /admin-tools/analytics.
  if (user.role !== "admin" && user.role !== "staff") redirect("/");

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1]" />}>
      <AdminShell role={user.role}>{children}</AdminShell>
    </Suspense>
  );
}
