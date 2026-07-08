/**
 * Admin section registry — the single source of truth for the
 * granular staff-permission model.
 *
 * Admins see everything. A "staff" user only sees the sections whose
 * `key` is listed in their `permissions` array. Used by:
 *   - the user editor (renders a checkbox per section)
 *   - the admin sidebar (filters nav items for staff)
 *   - the admin layout (server-side guards direct URLs)
 *   - the data browser (filters its collection tabs)
 *
 * "home" (the overview dashboard) and integration tools (hubspot-sync,
 * shopify-import) are admin-only and intentionally NOT grantable.
 */

export type SectionKey =
  | "analytics"
  | "clinical"
  | "dispensing"
  | "dispatching"
  | "orders"
  | "products"
  | "inventory"
  | "customers"
  | "consultations"
  | "discounts"
  | "content";

export const SECTIONS: { key: SectionKey; label: string; href: string; description: string }[] = [
  { key: "analytics", label: "Analytics", href: "/admin-tools/analytics", description: "Daily metrics dashboard" },
  { key: "orders", label: "Orders", href: "/admin-tools/data-browser?type=orders", description: "View & edit orders" },
  { key: "clinical", label: "Clinical Queue", href: "/admin-tools/clinical-queue", description: "Approve / decline consultations" },
  { key: "dispensing", label: "Dispatch queue", href: "/admin-tools/dispensing-queue", description: "Dispense + dispatch awaiting orders" },
  { key: "dispatching", label: "Dispatched", href: "/admin-tools/dispatching", description: "Dispatched orders + tracking" },
  { key: "products", label: "Products", href: "/admin-tools/data-browser?type=products", description: "Manage products" },
  { key: "inventory", label: "Inventory", href: "/admin-tools/inventory", description: "Pharmacy stock" },
  { key: "customers", label: "Customers", href: "/admin-tools/data-browser?type=users", description: "View customers" },
  { key: "consultations", label: "Consultations", href: "/admin-tools/data-browser?type=consultations", description: "View consultations" },
  { key: "discounts", label: "Discounts", href: "/admin-tools/data-browser?type=discounts", description: "Manage discount codes" },
  { key: "content", label: "Content", href: "/admin-tools/data-browser?type=posts", description: "Blog posts & media" },
];

export const SECTION_KEYS = SECTIONS.map((s) => s.key);

/** Which data-browser ?type= maps to which section. */
export function sectionForType(type: string | null | undefined): SectionKey | null {
  switch (type) {
    case "orders":
      return "orders";
    case "products":
      return "products";
    case "users":
      return "customers";
    case "consultations":
      return "consultations";
    case "discounts":
      return "discounts";
    case "posts":
    case "media":
      return "content";
    default:
      return null;
  }
}

/**
 * Resolve the section a given admin path belongs to.
 * Returns:
 *   - a SectionKey        → a grantable section
 *   - "home"              → the admin overview (admin only)
 *   - "admin-only"        → integration tools etc. (admin only)
 *   - null                → unknown (treat as admin only, i.e. deny staff)
 */
export function sectionForPath(
  path: string,
  type: string | null | undefined,
): SectionKey | "home" | "admin-only" | null {
  const p = path.replace(/\/+$/, "") || "/admin-tools";
  if (p === "/admin-tools") return "home";
  if (p.startsWith("/admin-tools/analytics")) return "analytics";
  if (p.startsWith("/admin-tools/clinical-queue")) return "clinical";
  if (p.startsWith("/admin-tools/dispensing-queue")) return "dispensing";
  if (p.startsWith("/admin-tools/dispatching")) return "dispatching";
  if (p.startsWith("/admin-tools/inventory")) return "inventory";
  if (p.startsWith("/admin-tools/products")) return "products";
  if (p.startsWith("/admin-tools/orders")) return "orders";
  if (p.startsWith("/admin-tools/customers")) return "customers";
  if (p.startsWith("/admin-tools/shopify-import")) return "admin-only";
  if (p.startsWith("/admin-tools/hubspot-sync")) return "admin-only";
  if (p.startsWith("/admin-tools/edit/")) {
    const editType = p.split("/")[3]; // /admin-tools/edit/<type>/<id>
    return sectionForType(editType) ?? "admin-only";
  }
  if (p.startsWith("/admin-tools/data-browser")) {
    return sectionForType(type) ?? "orders"; // bare data-browser defaults to orders
  }
  return null;
}

/** True if this user may open the given section. Admins → always. */
export function canAccessSection(
  role: string,
  permissions: string[] | undefined,
  section: SectionKey | "home" | "admin-only" | null,
): boolean {
  if (role === "admin") return true;
  if (role !== "staff") return false;
  if (section === "home" || section === "admin-only" || section === null) return false;
  return (permissions ?? []).includes(section);
}

/** Data-browser ?type= values a user may see. `null` = all (admin). */
export function allowedDataBrowserTypes(
  role: string,
  permissions: string[] | undefined,
): string[] | null {
  if (role === "admin") return null;
  const perms = permissions ?? [];
  const out: string[] = [];
  if (perms.includes("orders")) out.push("orders");
  if (perms.includes("products")) out.push("products");
  if (perms.includes("customers")) out.push("users");
  if (perms.includes("consultations")) out.push("consultations");
  if (perms.includes("discounts")) out.push("discounts");
  if (perms.includes("content")) out.push("posts", "media");
  return out;
}

/** The landing page a user should be sent to (first section they can see). */
export function firstAllowedHref(role: string, permissions: string[] | undefined): string {
  if (role === "admin") return "/admin-tools";
  const perms = permissions ?? [];
  const first = SECTIONS.find((s) => perms.includes(s.key));
  return first ? first.href : "/admin-tools/no-access";
}
