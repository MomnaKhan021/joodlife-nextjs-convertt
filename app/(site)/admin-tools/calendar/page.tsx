import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendar — JoodLife",
};

/** Bookings calendar (preview). Admin-only. */
export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/calendar");
  if (user.role !== "admin" && user.role !== "staff") redirect("/admin-tools");
  return <CalendarClient />;
}
