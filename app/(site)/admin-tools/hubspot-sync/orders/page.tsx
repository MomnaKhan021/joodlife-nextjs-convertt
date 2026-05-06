import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import SyncClientShell from "../SyncClientShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HubSpot Sync · Orders — JoodLife",
};

export default async function HubSpotOrdersSyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/hubspot-sync/orders");
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
          Sync orders from HubSpot
        </h1>
        <p className="mt-3 max-w-[640px] font-ui text-[15px] text-[#142e2a]/75">
          Pull HubSpot Deals into JoodLife&apos;s orders table. Customer info
          (name, email, phone) is taken from the deal&apos;s{" "}
          <code className="rounded bg-[#142e2a]/8 px-1 py-[1px] text-[12px]">jood_*</code>{" "}
          properties or its associated contact. The order&apos;s{" "}
          <code className="rounded bg-[#142e2a]/8 px-1 py-[1px] text-[12px]">user_id</code>{" "}
          is linked when a matching email exists in the users table.
        </p>
      </div>

      <SyncClientShell
        endpoint="/api/hubspot/sync-orders"
        label="Start order sync"
        description="Each batch pulls 100 deals from HubSpot and upserts them into your orders table. The match key is the HubSpot deal id, with order_number as a legacy fallback."
        cmsLink="/admin/collections/orders"
        cmsLinkLabel="Open Orders in CMS"
      />
    </main>
  );
}
