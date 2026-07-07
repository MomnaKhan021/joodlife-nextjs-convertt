import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import EditClient from "./EditClient";
import "../../../data-browser/data-browser.css";
import "./edit.css";

export const dynamic = "force-dynamic";

type RouteParams = { type: string; id: string };

export const metadata = {
  title: "Edit — JoodLife",
};

const VALID_TYPES = new Set([
  "orders",
  "consultations",
  "posts",
  "users",
  "products",
  "media",
  "discounts",
]);

/**
 * Custom edit page for any record in any collection. Bypasses
 * Payload's broken admin chrome on Next 16. The server-side bit
 * just admin-gates and validates the route params; the actual
 * fetch + form rendering happens in the client component.
 */
export default async function EditPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { type, id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/admin-tools/edit/${type}/${id}`);
  }
  if (user.role !== "admin" && user.role !== "staff") redirect("/"); // layout enforces per-section access
  if (!VALID_TYPES.has(type)) redirect("/admin-tools/data-browser");

  return (
    <main className="db-shell">
      <EditClient type={type} id={id} />
    </main>
  );
}
