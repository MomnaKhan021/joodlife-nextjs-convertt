import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  canAccessSection,
  firstAllowedHref,
  sectionForPath,
} from "@/lib/adminSections";
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
  if (user.role !== "admin" && user.role !== "staff") redirect("/");

  // Per-section guard for staff. Admins pass everything. Staff may only
  // open sections in their permissions list — the current path is
  // forwarded by middleware as x-admin-pathname/x-admin-search.
  if (user.role === "staff") {
    const h = await headers();
    const path = h.get("x-admin-pathname") ?? "/admin-tools";
    // The no-access notice must stay reachable, else redirecting a
    // permission-less staff member there would loop forever.
    if (!path.startsWith("/admin-tools/no-access")) {
      const search = h.get("x-admin-search") ?? "";
      const type = new URLSearchParams(search).get("type");
      const section = sectionForPath(path, type);
      if (!canAccessSection(user.role, user.permissions, section)) {
        redirect(firstAllowedHref(user.role, user.permissions));
      }
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1]" />}>
      <AdminShell role={user.role} permissions={user.permissions}>
        {children}
      </AdminShell>
    </Suspense>
  );
}
