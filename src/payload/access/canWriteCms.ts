import type { Access } from "payload";

import type { SectionKey } from "@/lib/adminSections";

/**
 * Plain predicate: may this user act on a CMS resource owned by `keys`?
 *
 * Admins always may. A "staff" user may when one of the owning section keys is
 * in their granted `permissions` — the same keys that gate the matching /cms
 * screen (lib/cmsSections.ts), so whoever can open an editor can also load and
 * save it. Everyone else (customers, anonymous) may not.
 *
 * `user` is Payload's loosely-typed auth user, so it is narrowed here.
 */
export function userCanWriteCms(user: unknown, keys: SectionKey[]): boolean {
  const u = user as { role?: string | null; permissions?: unknown } | null | undefined;
  if (!u) return false;
  if (u.role === "admin") return true;
  if (u.role !== "staff") return false;
  const perms = Array.isArray(u.permissions) ? u.permissions.map(String) : [];
  return keys.some((k) => perms.includes(k));
}

/**
 * WRITE access for CMS globals and collections.
 *
 * The CMS navigation layer (lib/cmsSections.ts) already lets a "staff" user
 * with the right `permissions` OPEN an editor. This is the matching data-layer
 * rule so they can also SAVE it. Admins always write; customers (and anonymous
 * requests) never do.
 *
 * Delete is intentionally NOT granted through this helper — destructive
 * removal of posts/pages/media stays admin-only (see the collections).
 *
 * Pass every key that should unlock the resource, e.g. the home-page global
 * carries both the home sections and the announcement bar, so it accepts
 * "cms-sections" and "cms-navigation".
 */
export const canWriteCms =
  (...keys: SectionKey[]): Access =>
  ({ req: { user } }) =>
    userCanWriteCms(user, keys);
