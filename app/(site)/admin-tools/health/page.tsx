import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import HealthClient from "./HealthClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System health — JoodLife",
};

/** Admin-only live self-check for the dashboard integrations. */
export default async function HealthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/health");
  if (user.role !== "admin") redirect("/admin-tools");
  return <HealthClient />;
}
