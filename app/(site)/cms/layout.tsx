import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  canAccessCms,
  canAccessCmsPath,
  firstAllowedCmsHref,
  sectionForCmsPath,
} from "@/lib/cmsSections";
import CmsShell from "./CmsShell";

export const dynamic = "force-dynamic";

/**
 * Shared chrome for every /cms page: left sidebar + content area.
 * Access-gated centrally here so each page doesn't repeat the checks.
 *
 * Gate order mirrors /admin-tools:
 *   1. signed out            → /login?next=…
 *   2. customers             → / (the CMS is staff-only)
 *   3. staff without a grant → their first allowed CMS page
 */
export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cms");

  // Customers (and any unknown role) never see the CMS.
  if (!canAccessCms(user.role, user.permissions)) redirect("/");

  // Per-section guard for staff. Admins pass everything. The current path
  // is forwarded by middleware as x-admin-pathname, since layouts can't
  // read the pathname from props.
  if (user.role === "staff") {
    const h = await headers();
    const path = h.get("x-admin-pathname") ?? "/cms";
    const section = sectionForCmsPath(path);
    if (!canAccessCmsPath(user.role, user.permissions, section)) {
      redirect(firstAllowedCmsHref(user.role, user.permissions));
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
      <CmsShell
        role={user.role}
        permissions={user.permissions ?? []}
        userEmail={user.email}
      >
        {children}
      </CmsShell>
    </Suspense>
  );
}
