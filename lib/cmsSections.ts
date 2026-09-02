/**
 * CMS dashboard registry — the nav + access model for `/cms`.
 *
 * Deliberately built on the SAME permission keys as the operations
 * dashboard ([lib/adminSections.ts]) rather than a parallel scheme, so:
 *   - the user editor keeps rendering one checkbox per section
 *   - staff grants work identically across /admin-tools and /cms
 *   - "content" (blog posts & media) is shared, not duplicated
 *
 * Admins see everything. A "staff" user sees only the entries whose `key`
 * is in their `permissions` array. Customers never reach /cms at all.
 */

import type { SectionKey } from "./adminSections";

/** Whether the underlying feature is actually built yet. */
export type CmsItemStatus = "ready" | "planned";

export type CmsNavItem = {
  /** Permission key — shared with the operations section registry. */
  key: SectionKey;
  label: string;
  href: string;
  description: string;
  status: CmsItemStatus;
  /** Path prefix used to mark the item active in the sidebar. */
  match: string;
};

export const CMS_NAV: CmsNavItem[] = [
  {
    key: "content",
    label: "Blog posts",
    href: "/cms/blogs",
    description: "Write and publish articles",
    status: "ready",
    match: "/cms/blogs",
  },
  {
    key: "content",
    label: "Media",
    href: "/cms/media",
    description: "Images and uploads",
    status: "ready",
    match: "/cms/media",
  },
  {
    key: "cms-pages",
    label: "Pages",
    href: "/cms/pages",
    description: "Create new pages with rich text",
    status: "ready",
    match: "/cms/pages",
  },
  {
    key: "cms-navigation",
    label: "Header",
    href: "/cms/header",
    description: "Top navigation and the mega menu",
    status: "ready",
    match: "/cms/header",
  },
  {
    key: "cms-navigation",
    label: "Footer",
    href: "/cms/footer",
    description: "Footer columns, contact card and small print",
    status: "ready",
    match: "/cms/footer",
  },
  {
    key: "cms-sections",
    label: "Home page",
    href: "/cms/home",
    description: "Every home page section, in page order",
    status: "ready",
    match: "/cms/home",
  },
  {
    key: "cms-pages",
    label: "Terms & conditions",
    href: "/cms/policies/terms",
    description: "The terms page at /policies/terms",
    status: "ready",
    match: "/cms/policies/terms",
  },
  {
    key: "cms-pages",
    label: "Refund & Complaints",
    href: "/cms/policies/refund-complaints",
    description: "The refund and complaints procedure",
    status: "ready",
    match: "/cms/policies/refund-complaints",
  },
  {
    key: "cms-pages",
    label: "Privacy & Cookies",
    href: "/cms/policies/privacy",
    description: "The privacy and cookies page",
    status: "ready",
    match: "/cms/policies/privacy",
  },
  {
    key: "cms-navigation",
    label: "Announcement bar",
    href: "/cms/announcement",
    description: "The strip above the header, shown sitewide",
    status: "ready",
    match: "/cms/announcement",
  },
];

/** Every permission key that grants some part of the CMS. */
export const CMS_SECTION_KEYS: SectionKey[] = Array.from(
  new Set(CMS_NAV.map((i) => i.key)),
);

/**
 * Resolve which permission key a /cms path needs.
 *   - a SectionKey → that grant is required
 *   - "cms-home"   → the /cms overview (any CMS grant will do)
 *   - null         → unknown path, treat as admin-only
 */
export function sectionForCmsPath(
  path: string,
): SectionKey | "cms-home" | null {
  const p = path.replace(/\/+$/, "") || "/cms";
  if (p === "/cms") return "cms-home";
  const hit = CMS_NAV.find((i) => p.startsWith(i.match));
  return hit ? hit.key : null;
}

/** True if this user may open the CMS at all. Admins → always. */
export function canAccessCms(
  role: string,
  permissions: string[] | undefined,
): boolean {
  if (role === "admin") return true;
  if (role !== "staff") return false;
  const perms = permissions ?? [];
  return CMS_SECTION_KEYS.some((k) => perms.includes(k));
}

/** True if this user may open one specific CMS path. */
export function canAccessCmsPath(
  role: string,
  permissions: string[] | undefined,
  section: SectionKey | "cms-home" | null,
): boolean {
  if (role === "admin") return true;
  if (role !== "staff") return false;
  if (section === null) return false;
  if (section === "cms-home") return canAccessCms(role, permissions);
  return (permissions ?? []).includes(section);
}

/** Nav entries this user is allowed to see. */
export function visibleCmsNav(
  role: string,
  permissions: string[] | undefined,
): CmsNavItem[] {
  if (role === "admin") return CMS_NAV;
  const perms = permissions ?? [];
  return CMS_NAV.filter((i) => perms.includes(i.key));
}

/** Where to send a user who hit a CMS page they may not open. */
export function firstAllowedCmsHref(
  role: string,
  permissions: string[] | undefined,
): string {
  if (role === "admin") return "/cms";
  const first = visibleCmsNav(role, permissions)[0];
  return first ? first.href : "/admin-tools/no-access";
}
