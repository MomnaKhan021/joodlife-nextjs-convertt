import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { firstAllowedHref } from "@/lib/adminSections";
import StaffRedirect from "./StaffRedirect";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — JoodLife",
};

/**
 * /admin-tools has no page of its own: the Home overview is hidden, so admins
 * land on Analytics and staff on the first section they've been granted.
 * (HomeClient.tsx is kept, unused, in case Home comes back.)
 *
 * The hop is done in the browser because a server redirect() here sits inside
 * the layout's Suspense boundary and isn't followed on a client-side
 * navigation (the page came up empty until a refresh).
 */
export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools");
  if (user.role !== "admin" && user.role !== "staff") redirect("/");
  return <StaffRedirect to={firstAllowedHref(user.role, user.permissions)} />;
}
