import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics — JoodLife",
};

/**
 * Daily-monitoring analytics dashboard ("Metrics to monitor daily").
 * Visible to admins AND staff accounts — staff (e.g. analysts) get this
 * page only, while the rest of /admin-tools stays admin-only.
 */
export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/analytics");
  if (user.role !== "admin" && user.role !== "staff") redirect("/");

  return <AnalyticsClient />;
}
