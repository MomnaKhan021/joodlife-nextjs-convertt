import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — JoodLife",
};

/**
 * Admin home (overview dashboard). Admin-only — staff accounts are
 * routed straight to the analytics dashboard they're allowed to see.
 */
export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools");
  if (user.role === "staff") redirect("/admin-tools/analytics");
  if (user.role !== "admin") redirect("/");

  return <HomeClient />;
}
