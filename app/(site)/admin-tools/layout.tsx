import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  canAccessSection,
  firstAllowedHref,
  sectionForPath,
} from "@/lib/adminSections";
import { getPayloadInstance } from "@/lib/payload";
import { verifyTwoFactorCookie, TWOFA_COOKIE } from "@/lib/totp";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

/**
 * Reads whether this admin has 2FA switched on. Fail-open: any DB/init error
 * returns false so a hiccup can never lock an admin out of the portal.
 */
async function twoFactorEnabled(userId: string): Promise<boolean> {
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as { drizzle?: { execute: (q: unknown) => Promise<unknown> } }
    ).drizzle;
    if (!drizzle) return false;
    const { sql } = (await import("drizzle-orm")) as { sql: { raw: (s: string) => unknown } };
    const res = await drizzle.execute(
      sql.raw(`SELECT totp_enabled FROM users WHERE id = ${Number(userId)} LIMIT 1`),
    );
    const list = Array.isArray(res)
      ? res
      : ((res as { rows?: unknown[] })?.rows ?? []);
    return Boolean((list[0] as { totp_enabled?: boolean } | undefined)?.totp_enabled);
  } catch {
    return false;
  }
}

/**
 * Shared chrome for every /admin-tools page: a Shopify-style left sidebar
 * + content area. Admin-gated centrally here so each page doesn't need to.
 */
export default async function AdminToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-tools");
  if (user.role !== "admin" && user.role !== "staff") redirect("/");

  // Two-factor gate. Only affects admins who have explicitly enabled 2FA, and
  // the verify page itself is always reachable (else the redirect would loop).
  const h2fa = await headers();
  const path2fa = h2fa.get("x-admin-pathname") ?? "/admin-tools";
  if (!path2fa.startsWith("/admin-tools/verify-2fa")) {
    if (await twoFactorEnabled(user.id)) {
      const cookie = (await cookies()).get(TWOFA_COOKIE)?.value;
      if (!verifyTwoFactorCookie(cookie, user.id)) {
        redirect("/admin-tools/verify-2fa");
      }
    }
  }

  // Per-section guard for staff. Admins pass everything. Staff may only
  // open sections in their permissions list — the current path is
  // forwarded by middleware as x-admin-pathname/x-admin-search.
  if (user.role === "staff") {
    const h = await headers();
    const path = h.get("x-admin-pathname") ?? "/admin-tools";
    // The no-access notice must stay reachable, else redirecting a
    // permission-less staff member there would loop forever.
    if (!path.startsWith("/admin-tools/no-access")) {
      const search = h.get("x-admin-search") ?? "";
      const type = new URLSearchParams(search).get("type");
      const section = sectionForPath(path, type);
      if (!canAccessSection(user.role, user.permissions, section)) {
        redirect(firstAllowedHref(user.role, user.permissions));
      }
    }
  }

  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f9f2] text-[14px] text-[#616161]">
          Loading…
        </div>
      }
    >
      <AdminShell role={user.role} permissions={user.permissions}>
        {children}
      </AdminShell>
    </Suspense>
  );
}
