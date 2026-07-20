/**
 * One-time admin bootstrap.
 *
 * Promotes an EXISTING user to role = "admin" so they can reach the
 * /admin-tools dashboard. Gated by a secret you set yourself in Vercel:
 *
 *   1. In Vercel → Project → Settings → Environment Variables, add
 *        ADMIN_BOOTSTRAP_SECRET = <any long random string>
 *      and redeploy.
 *   2. Call (GET or POST):
 *        /api/admin-tools/bootstrap?secret=<that string>&email=you@example.com
 *   3. It sets that user's role to "admin". Log in at /login.
 *   4. DELETE the ADMIN_BOOTSTRAP_SECRET env var afterwards (or the route
 *      returns 503 and does nothing without it).
 *
 * It NEVER touches passwords and NEVER creates accounts — the target must
 * already exist (sign up at /signup first if needed). Nothing here works
 * unless ADMIN_BOOTSTRAP_SECRET is set AND matches, so it's inert in normal
 * operation.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

async function getDrizzle() {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  return { drizzle: drizzle as DrizzleLike, sql };
}

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Disabled. Set ADMIN_BOOTSTRAP_SECRET in Vercel to enable, then redeploy." },
      { status: 503 }
    );
  }
  const secret =
    url.searchParams.get("secret") || req.headers.get("x-bootstrap-secret") || "";
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email query param required" }, { status: 400 });
  }
  const safe = email.replace(/'/g, "''");

  try {
    const { drizzle, sql } = await getDrizzle();
    const result = (await drizzle.execute(
      sql.raw(
        `UPDATE users SET role = 'admin' WHERE lower(email) = '${safe}' RETURNING id, email, role;`
      )
    )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No user with that email. Sign up at /signup first, then retry.", email },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, promoted: rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: "Update failed", detail: err instanceof Error ? err.message : String(err) },
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
