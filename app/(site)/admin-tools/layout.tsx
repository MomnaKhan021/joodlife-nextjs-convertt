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
  if (user.role !== "admin") redirect("/");

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1]" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
