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
 *
 * Entries are also sorted into GROUPS. The permission key answers "may this
 * person open it"; the group answers "where would someone look for it" —
 * two different questions, so they are two different fields. Grouping by
 * permission would put the policy pages beside the page builder purely
 * because they happen to share a grant.
 */

import type { SectionKey } from "./adminSections";

/** Whether the underlying feature is actually built yet. */
export type CmsItemStatus = "ready" | "planned";

/** Sidebar groups, in display order. */
export const CMS_GROUPS = [
  {
    key: "blog",
    label: "Blog",
    description: "Articles and the page they sit on",
  },
  {
    key: "site-pages",
    label: "Site pages",
    description: "Copy and images on the pages the site ships with",
  },
  {
    key: "custom-pages",
    label: "Custom pages",
    description: "Pages you create yourself",
  },
  {
    key: "legal",
    label: "Legal",
    description: "Terms, refunds and privacy",
  },
  {
    key: "site-wide",
    label: "Site-wide",
    description: "Shown on every page",
  },
  {
    key: "media",
    label: "Media",
    description: "Images used across the site",
  },
] as const;

export type CmsGroupKey = (typeof CMS_GROUPS)[number]["key"];

export type CmsNavItem = {
  /** Permission key — shared with the operations section registry. */
  key: SectionKey;
  /** Which sidebar group this belongs under. */
  group: CmsGroupKey;
  label: string;
  href: string;
  description: string;
  status: CmsItemStatus;
  /** Path prefix used to mark the item active in the sidebar. */
  match: string;
};

export const CMS_NAV: CmsNavItem[] = [
  /* ── Blog ─────────────────────────────────────────────── */
  {
    key: "content",
    group: "blog",
    label: "Blog posts",
    href: "/cms/blogs",
    description: "Write, edit and publish articles",
    status: "ready",
    match: "/cms/blogs",
  },
  {
    key: "cms-sections",
    group: "blog",
    label: "Blog listing page",
    href: "/cms/blog-page",
    description: "The hero, newsletter and banner around the articles",
    status: "ready",
    match: "/cms/blog-page",
  },

  /* ── Site pages ───────────────────────────────────────── */
  {
    key: "cms-sections",
    group: "site-pages",
    label: "Home page",
    href: "/cms/home",
    description: "Every section of the home page, in page order",
    status: "ready",
    match: "/cms/home",
  },
  {
    key: "cms-sections",
    group: "site-pages",
    label: "Support page",
    href: "/cms/support",
    description: "Hero, FAQs and success stories",
    status: "ready",
    match: "/cms/support",
  },
  {
    key: "cms-sections",
    group: "site-pages",
    label: "Wegovy Pills",
    href: "/cms/wegovy",
    description: "All eleven sections of /wegovy-pills",
    status: "ready",
    match: "/cms/wegovy",
  },
  {
    key: "cms-sections",
    group: "site-pages",
    label: "Erectile dysfunction",
    href: "/cms/ed",
    description: "All eight sections of /erectile-dysfunction",
    status: "ready",
    match: "/cms/ed",
  },
  {
    key: "cms-sections",
    group: "site-pages",
    label: "Shared across treatments",
    href: "/cms/category-pages",
    description:
      "Trust strip, features and FAQs on the weight-loss, ED and period-delay pages",
    status: "ready",
    match: "/cms/category-pages",
  },

  /* ── Custom pages ─────────────────────────────────────── */
  {
    key: "cms-pages",
    group: "custom-pages",
    label: "All pages",
    href: "/cms/pages",
    description: "Create and edit standalone pages at /your-slug",
    status: "ready",
    match: "/cms/pages",
  },

  /* ── Legal ────────────────────────────────────────────── */
  {
    key: "cms-pages",
    group: "legal",
    label: "Terms & conditions",
    href: "/cms/policies/terms",
    description: "The terms page at /policies/terms",
    status: "ready",
    match: "/cms/policies/terms",
  },
  {
    key: "cms-pages",
    group: "legal",
    label: "Refund & Complaints",
    href: "/cms/policies/refund-complaints",
    description: "The refund and complaints procedure",
    status: "ready",
    match: "/cms/policies/refund-complaints",
  },
  {
    key: "cms-pages",
    group: "legal",
    label: "Privacy & Cookies",
    href: "/cms/policies/privacy",
    description: "The privacy and cookies page",
    status: "ready",
    match: "/cms/policies/privacy",
  },

  /* ── Site-wide ────────────────────────────────────────── */
  {
    key: "cms-navigation",
    group: "site-wide",
    label: "Header",
    href: "/cms/header",
    description: "Top navigation, logo and the mega menu",
    status: "ready",
    match: "/cms/header",
  },
  {
    key: "cms-navigation",
    group: "site-wide",
    label: "Footer",
    href: "/cms/footer",
    description: "Footer columns, contact card and small print",
    status: "ready",
    match: "/cms/footer",
  },
  {
    key: "cms-navigation",
    group: "site-wide",
    label: "Announcement bar",
    href: "/cms/announcement",
    description: "The strip above the header",
    status: "ready",
    match: "/cms/announcement",
  },

  /* ── Media ────────────────────────────────────────────── */
  {
    key: "content",
    group: "media",
    label: "Media library",
    href: "/cms/media",
    description: "Images and uploads used anywhere on the site",
    status: "ready",
    match: "/cms/media",
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
 *
 * Longest match wins, so /cms/blog-page isn't shadowed by a shorter prefix.
 */
export function sectionForCmsPath(
  path: string,
): SectionKey | "cms-home" | null {
  const p = path.replace(/\/+$/, "") || "/cms";
  if (p === "/cms") return "cms-home";
  const hit = [...CMS_NAV]
    .sort((a, b) => b.match.length - a.match.length)
    .find((i) => p === i.match || p.startsWith(`${i.match}/`));
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

/** Nav entries this user is allowed to see, in registry order. */
export function visibleCmsNav(
  role: string,
  permissions: string[] | undefined,
): CmsNavItem[] {
  if (role === "admin") return CMS_NAV;
  const perms = permissions ?? [];
  return CMS_NAV.filter((i) => perms.includes(i.key));
}

export type CmsNavGroup = {
  key: CmsGroupKey;
  label: string;
  description: string;
  items: CmsNavItem[];
};

/**
 * The same entries, bucketed into groups for display. A group whose items
 * this user can't see is dropped entirely rather than left as an empty
 * heading.
 */
export function groupedCmsNav(
  role: string,
  permissions: string[] | undefined,
): CmsNavGroup[] {
  const visible = visibleCmsNav(role, permissions);
  return CMS_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    description: g.description,
    items: visible.filter((i) => i.group === g.key),
  })).filter((g) => g.items.length > 0);
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
