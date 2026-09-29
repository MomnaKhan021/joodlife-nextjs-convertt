import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { firstAllowedHref } from "@/lib/adminSections";
import HomeClient from "./HomeClient";
import StaffRedirect from "./StaffRedirect";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — JoodLife",
};

/**
 * Admin home (overview dashboard). Admin-only — staff accounts are
 * routed to the first section they have been granted (not a hardcoded
 * page they may not hold, which would only bounce them again).
 */
export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools");
  // A server redirect() here sits inside the layout's Suspense boundary and
  // is not followed on a client-side navigation (the page came up empty until
  // a refresh), so staff are hopped from the browser instead.
  if (user.role === "staff") {
    return <StaffRedirect to={firstAllowedHref(user.role, user.permissions)} />;
  }
  if (user.role !== "admin") redirect("/");

  return <HomeClient />;
}
