import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import HubSpotSyncClient from "./HubSpotSyncClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HubSpot Sync — JoodLife",
};

/**
 * Admin-only HubSpot bulk-pull tool. Calls /api/hubspot/sync-contacts
 * in a loop on the client (each call upserts up to 100 contacts) and
 * reports live progress. Synced contacts land in the Payload `users`
 * table and are immediately visible at /admin → Customers → Users.
 */
export default async function HubSpotSyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/hubspot-sync");
  if (user.role !== "admin") redirect("/");

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-[60px] md:py-16">
      <div className="mb-8">
        <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
          Admin tools
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
          Sync contacts from HubSpot
        </h1>
        <p className="mt-3 max-w-[640px] font-ui text-[15px] text-[#142e2a]/75">
          Pull every contact from your HubSpot account into JoodLife&apos;s
          users table. Existing rows (matched by email) get name and phone
          updated; new ones are inserted as customers and can claim their
          account via the password-reset flow.
        </p>
      </div>

      <HubSpotSyncClient />
    </main>
  );
}
