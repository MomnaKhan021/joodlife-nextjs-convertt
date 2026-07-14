import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  canAccessSection,
  firstAllowedHref,
  sectionForPath,
} from "@/lib/adminSections";
import { requiresTwoFactor } from "@/lib/twoFactor";
import AdminShell from "./AdminShell";
import TwoFactorGate from "./TwoFactorGate";

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

  // Two-factor gate — render a full-screen blocking prompt IN PLACE OF the
  // dashboard (no navigation, so it can't blank out) until a code is entered.
  // Only affects admins who have enabled 2FA; fail-open on any error.
  if (await requiresTwoFactor()) {
    return <TwoFactorGate />;
  }

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
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f9f2] text-[14px] text-[#616161]">
          Loading…
        </div>
      }
    >
      <AdminShell role={user.role} permissions={user.permissions}>
        {children}
      </AdminShell>
    </Suspense>
  );
}
