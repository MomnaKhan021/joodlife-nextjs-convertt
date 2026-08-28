import "server-only";

import { headers as nextHeaders } from "next/headers";
import { getPayloadInstance } from "@/lib/payload";

/**
 * Authenticated user shape we surface to the rest of the app.
 * Payload's typings keep most of these optional so we narrow them
 * defensively before returning.
 */
export type AuthedUser = {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "customer" | "staff" | string;
  /** Section keys a staff member may access (see lib/adminSections).
   *  Empty/undefined for non-staff (admins have full access anyway). */
  permissions: string[];
};

/**
 * Reads the Payload auth cookie from the current request and returns
 * the authenticated user, or `null` if the request is anonymous /
 * the cookie is invalid / Payload can't initialise (e.g. missing env
 * vars during build).
 *
 * Use from Server Components, Route Handlers, Server Actions.
 */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  try {
    const payload = await getPayloadInstance();
    const result = await payload.auth({ headers: await nextHeaders() });
    if (!result.user) return null;

    const u = result.user as {
      id: string | number;
      email?: string;
      name?: string;
      role?: string;
      permissions?: unknown;
    };

    const permissions = Array.isArray(u.permissions)
      ? (u.permissions as unknown[]).map(String)
      : [];

    // Allowlisted emails are always admins — if a boot-time promotion was
    // missed, heal the role here so the dashboard never locks them out.
    let role = u.role ?? "customer";
    if (role !== "admin") {
      const { promoteIfAllowlisted } = await import("@/lib/adminAllowlist");
      if (await promoteIfAllowlisted(payload, { id: u.id, email: u.email, role })) {
        role = "admin";
      }
    }

    return {
      id: String(u.id),
      email: u.email ?? "",
      name: u.name,
      role,
      permissions,
    };
  } catch {
    return null;
  }
}
