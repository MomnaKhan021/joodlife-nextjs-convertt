import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import SyncClientShell from "../SyncClientShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HubSpot Sync · Consultations — JoodLife",
};

export default async function HubSpotConsultationsSyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/hubspot-sync/consultations");
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
          Sync consultations from HubSpot
        </h1>
        <p className="mt-3 max-w-[640px] font-ui text-[15px] text-[#142e2a]/75">
          Pull records from your HubSpot consultation custom-object into the
          JoodLife consultations table. The HubSpot object id is the upsert
          key, so re-runs update existing rows in place. Set{" "}
          <code className="rounded bg-[#142e2a]/8 px-1 py-[1px] text-[12px]">HUBSPOT_CONSULTATIONS_OBJECT_TYPE</code>{" "}
          if the custom object slug isn&apos;t {""}
          <code className="rounded bg-[#142e2a]/8 px-1 py-[1px] text-[12px]">consultations</code>.
        </p>
      </div>

      <SyncClientShell
        endpoint="/api/hubspot/sync-consultations"
        label="Start consultation sync"
        description="Each batch pulls 100 consultation records from HubSpot and upserts them into your consultations table, parsing the answers JSON inline."
        cmsLink="/admin/collections/consultations"
        cmsLinkLabel="Open Consultations in CMS"
      />
    </main>
  );
}
