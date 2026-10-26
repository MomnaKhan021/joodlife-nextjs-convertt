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
 * The new patient portal (v4 design), live at /new_profile for testing while
 * patients keep using /profile. When it's signed off, this replaces /profile
 * and /new_profile/login replaces /login.
 */
export default async function NewProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/new_profile/login?next=/new_profile");
  const initial = await loadPortal(user);
  return <PortalApp initial={initial} />;
}
