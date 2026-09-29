import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { firstAllowedHref } from "@/lib/adminSections";
import HomeClient from "./HomeClient";

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
  if (user.role === "staff") redirect(firstAllowedHref(user.role, user.permissions));
  if (user.role !== "admin") redirect("/");

  return <HomeClient />;
}
