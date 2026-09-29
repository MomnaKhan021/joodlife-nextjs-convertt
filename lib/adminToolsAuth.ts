/**
 * Authorisation for the /api/admin-tools/* data endpoints.
 *
 * The dashboard pages already decide WHICH sections a "staff" user may open
 * (lib/adminSections.ts). These helpers are the matching rule for the APIs
 * those pages call, so a staff member who can open a section can also load
 * its data — previously every endpoint demanded role === "admin", which left
 * granted staff staring at empty tables.
 *
 * Admins pass everything. Staff pass only for the section (or data-browser
 * type) their granted `permissions` cover. Customers and anonymous requests
 * never pass.
 */
import {
  canAccessSection,
  sectionForType,
  type SectionKey,
} from "@/lib/adminSections";

type AuthUser = { role?: string | null; permissions?: unknown } | null | undefined;

function permsOf(user: AuthUser): string[] {
  const raw = user?.permissions;
  return Array.isArray(raw) ? raw.map(String) : [];
}

/** Payload's auth user is loosely typed, so every helper narrows here. */
export function isAdminUser(user: unknown): boolean {
  return (user as AuthUser)?.role === "admin";
}

/** Admin, or staff who hold `section`. `null` section → admin only. */
export function canUseSection(
  user: unknown,
  section: SectionKey | "home" | "admin-only" | null,
): boolean {
  const u = user as AuthUser;
  if (!u) return false;
  if (u.role === "admin") return true;
  if (u.role !== "staff") return false;
  return canAccessSection("staff", permsOf(u), section);
}

/** Admin, or staff who hold ANY of `sections`. */
export function canUseAnySection(user: unknown, sections: SectionKey[]): boolean {
  return sections.some((s) => canUseSection(user, s));
}

/** Admin, or staff who hold the section that owns data-browser `type`. */
export function canUseType(user: unknown, type: string): boolean {
  return canUseSection(user, sectionForType(type));
}
