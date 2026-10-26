import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import type { AuthedUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";
import { ensurePortalTables, getDb, type Db } from "./db";

/** Shared guard for /api/portal/* routes: same origin, signed in, tables ready. */
export async function portalRequest(
  req: NextRequest,
): Promise<{ user: AuthedUser; uid: number; db: Db } | NextResponse> {
  if (req.method !== "GET" && !isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Cross-origin request rejected" }, { status: 403 });
  }
  // A missing or expired session is a real sign-out (the portal sends the
  // patient to /login). Anything else, such as the database timing out, is
  // reported as a temporary error so nobody gets bounced to the login page.
  if (!req.cookies.get("payload-token")?.value) return signedOut();
  let user: AuthedUser;
  try {
    const payload = await getPayloadInstance();
    // Payload ignores the session cookie when the Origin header isn't on its
    // CSRF list (e.g. www. vs bare domain, or a dev server on another port).
    // These routes already require the same origin above, so authenticate on
    // the cookie alone rather than depend on that list.
    const headers = new Headers(req.headers);
    headers.delete("origin");
    const res = await payload.auth({ headers });
    if (!res.user) return signedOut();
    const u = res.user as unknown as { id: number | string; email: string; name?: string; role?: string; permissions?: unknown };
    user = {
      id: String(u.id),
      email: String(u.email),
      name: u.name ?? undefined,
      role: u.role ?? "customer",
      permissions: Array.isArray(u.permissions) ? (u.permissions as string[]) : [],
    };
  } catch {
    return NextResponse.json({ ok: false, error: "We couldn't reach our servers. Please try again." }, { status: 503 });
  }
  const uid = Number(user.id);
  if (!Number.isFinite(uid)) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 400 });
  const db = await getDb();
  await ensurePortalTables(db);
  return { user, uid, db };
}

function signedOut() {
  return NextResponse.json({ ok: false, signedOut: true, error: "Please log in again" }, { status: 401 });
}

export function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  try {
    if (origin) return new URL(origin).host === host;
    if (referer) return new URL(referer).host === host;
  } catch {
    return false;
  }
  return true;
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const SVCS = ["wl", "ed", "pd"] as const;
export function svcOf(v: unknown): "wl" | "ed" | "pd" {
  return (SVCS as readonly string[]).includes(String(v)) ? (v as "wl" | "ed" | "pd") : "wl";
}
