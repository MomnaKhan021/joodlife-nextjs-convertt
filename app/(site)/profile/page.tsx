import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { loadPortal } from "@/lib/portal/data";
import PortalApp from "@/components/portal/PortalApp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your portal — Jood",
  robots: { index: false, follow: false },
};

/**
 * The patient portal (v4 design): treatment, orders, reminders, messages,
 * health record, help and account, for every Jood service the patient uses.
 * The screens live in components/portal; the data comes from lib/portal/data.
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const initial = await loadPortal(user);
  return <PortalApp initial={initial} />;
}
