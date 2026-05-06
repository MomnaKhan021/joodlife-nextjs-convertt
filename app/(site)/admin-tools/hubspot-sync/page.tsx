import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import DiagPanel from "./DiagPanel";
import SyncAllButton from "./SyncAllButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HubSpot Sync — JoodLife",
};

/**
 * Admin-only HubSpot sync hub. Three pull tools live here:
 *   - /contacts:      HubSpot Contacts → users table
 *   - /orders:        HubSpot Deals    → orders table
 *   - /consultations: HubSpot custom object → consultations table
 *
 * Each individual page reuses SyncClientShell to drive its own
 * /api/hubspot/sync-* endpoint.
 */
export default async function HubSpotSyncHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/hubspot-sync");
  if (user.role !== "admin") redirect("/");

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-[60px] md:py-16">
      <div className="mb-10">
        <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/60">
          Admin tools
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
          HubSpot sync
        </h1>
        <p className="mt-3 max-w-[720px] font-ui text-[15px] text-[#142e2a]/75">
          Pull data from your HubSpot account into JoodLife. The hourly
          Vercel cron pulls automatically; use the button below if you
          need an immediate sync, or open an individual tool for a
          single object type.
        </p>
      </div>

      <div className="mb-8">
        <SyncAllButton />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <SyncCard
          href="/admin-tools/hubspot-sync/contacts"
          eyebrow="Contacts"
          title="Customers"
          description="HubSpot Contacts → JoodLife users. Existing rows are matched by email and updated; new ones become customer accounts."
        />
        <SyncCard
          href="/admin-tools/hubspot-sync/orders"
          eyebrow="Deals"
          title="Orders"
          description="HubSpot Deals (with jood_* properties) → orders table. Customer info is attached to each order; user FK is set when the email matches."
        />
        <SyncCard
          href="/admin-tools/hubspot-sync/consultations"
          eyebrow="Custom object"
          title="Consultations"
          description="HubSpot consultation custom-object → consultations table. Answers JSON is parsed in; status normalised to draft/submitted/reviewed/approved/rejected."
        />
      </div>

      <DiagPanel />
    </main>
  );
}

function SyncCard({
  href,
  eyebrow,
  title,
  description,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[#142e2a]/10 bg-white p-6 transition hover:border-[#142e2a]/30 hover:shadow-sm"
    >
      <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[#142e2a]/55">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-[22px] font-semibold text-[#142e2a]">
        {title}
      </h2>
      <p className="mt-3 font-ui text-[13px] leading-relaxed text-[#142e2a]/70">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-[#142e2a] group-hover:gap-2">
        Open <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
