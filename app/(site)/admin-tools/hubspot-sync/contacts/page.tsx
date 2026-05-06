import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import SyncClientShell from "../SyncClientShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HubSpot Sync · Contacts — JoodLife",
};

export default async function HubSpotContactsSyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/hubspot-sync/contacts");
  if (user.role !== "admin") redirect("/");

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-[60px] md:py-16">
      <div className="mb-8">
        <Link
          href="/admin-tools/hubspot-sync"
          className="font-ui text-[13px] text-[#142e2a]/65 hover:text-[#142e2a]"
        >
          ← All HubSpot syncs
        </Link>
        <p className="mt-4 font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
          Admin tools · HubSpot Sync
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

      <SyncClientShell
        endpoint="/api/hubspot/sync-contacts"
        label="Start contact sync"
        description="Each batch pulls 100 contacts from HubSpot and upserts them into your users table. The job continues automatically until every page is processed."
        cmsLink="/admin/collections/users"
        cmsLinkLabel="Open Users in CMS"
      />
    </main>
  );
}
