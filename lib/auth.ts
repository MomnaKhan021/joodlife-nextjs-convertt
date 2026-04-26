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
  role: "admin" | "customer" | string;
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
    };

    return {
      id: String(u.id),
      email: u.email ?? "",
      name: u.name,
      role: u.role ?? "customer",
    };
  } catch {
    return null;
  }
}
