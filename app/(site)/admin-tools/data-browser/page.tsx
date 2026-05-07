import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import DataBrowser from "./DataBrowser";
import "./data-browser.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data browser — JoodLife",
};

/**
 * Custom multi-collection data browser. A reliable read-only
 * surface for orders, consultations, posts, users, products,
 * media and discounts that doesn't depend on Payload's admin
 * chrome (which currently has rendering issues on Next 16 +
 * Payload v3 in this stack).
 *
 * The page authorises admins server-side, then hands off to the
 * client component which fetches data from
 * /api/admin-tools/list?type=<collection>.
 */
export default async function DataBrowserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools/data-browser");
  if (user.role !== "admin") redirect("/");

  return (
    <main className="db-shell">
      <header className="db-shell__header">
        <p className="db-shell__eyebrow">Admin · Data browser</p>
        <h1 className="db-shell__title">Browse all collections</h1>
        <p className="db-shell__subtitle">
          Search, sort and paginate every JoodLife collection — orders,
          consultations, posts, users, products, media and discounts —
          straight from the live database. Click any row to open it in the
          full Payload editor.
        </p>
      </header>

      <DataBrowser />
    </main>
  );
}
