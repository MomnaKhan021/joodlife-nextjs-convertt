/**
 * One-time admin bootstrap / rescue.
 *
 * Lets you create-or-promote an admin account and (optionally) set its
 * password, so you can get into the /admin-tools dashboard.
 *
 * GATE: pass `secret=` matching EITHER your existing `PAYLOAD_SECRET`
 * (already in Vercel — no new env var or redeploy needed) OR an
 * `ADMIN_BOOTSTRAP_SECRET` you add yourself. Without a matching secret the
 * route does nothing.
 *
 * USAGE (GET or POST):
 *   Check an account (read-only):
 *     /api/admin-tools/bootstrap?secret=<SECRET>&email=you@x.com&check=1
 *   Promote an existing account to admin:
 *     /api/admin-tools/bootstrap?secret=<SECRET>&email=you@x.com
 *   Create the account (if missing) as admin AND/OR (re)set its password:
 *     /api/admin-tools/bootstrap?secret=<SECRET>&email=you@x.com&password=YourPass123
 *
 * Then log in at /login. Afterwards, rotate PAYLOAD_SECRET or remove any
 * ADMIN_BOOTSTRAP_SECRET. Passwords are hashed by Payload's own auth layer.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(secret: string): boolean {
  const a = process.env.ADMIN_BOOTSTRAP_SECRET;
  const p = process.env.PAYLOAD_SECRET;
  if (!secret) return false;
  return (Boolean(a) && secret === a) || (Boolean(p) && secret === p);
}

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const secret =
    url.searchParams.get("secret") || req.headers.get("x-bootstrap-secret") || "";
  if (!authorized(secret)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized. Pass ?secret=<your PAYLOAD_SECRET> (from Vercel env), or set ADMIN_BOOTSTRAP_SECRET.",
      },
      { status: 401 }
    );
  }

  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const password = url.searchParams.get("password") || undefined;
  const checkOnly = url.searchParams.get("check") != null;
  if (!email) {
    return NextResponse.json({ error: "email query param required" }, { status: 400 });
  }

  try {
    const payload = await getPayloadInstance();
    const found = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    });
    const existing = found.docs[0] as
      | { id: number | string; email: string; role?: string }
      | undefined;

    if (checkOnly) {
      return NextResponse.json({
        exists: Boolean(existing),
        email,
        role: existing?.role ?? null,
        id: existing?.id ?? null,
        canLoginToDashboard: existing?.role === "admin",
      });
    }

    if (existing) {
      const data: Record<string, unknown> = { role: "admin" };
      if (password) data.password = password;
      const updated = await payload.update({
        collection: "users",
        id: existing.id,
        data,
        overrideAccess: true,
      });
      return NextResponse.json({
        ok: true,
        action: "promoted" + (password ? "+password-reset" : ""),
        user: {
          id: updated.id,
          email: updated.email,
          role: (updated as { role?: string }).role,
        },
      });
    }

    // No such user — create as admin, but only if a password was supplied.
    if (!password) {
      return NextResponse.json(
        {
          error:
            "No user with that email. Add &password=YourPass123 to this URL to create the admin account.",
          email,
        },
        { status: 404 }
      );
    }
    const created = await payload.create({
      collection: "users",
      data: { email, password, role: "admin" },
      overrideAccess: true,
    });
    return NextResponse.json({
      ok: true,
      action: "created-admin",
      user: {
        id: created.id,
        email: created.email,
        role: (created as { role?: string }).role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Bootstrap failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
