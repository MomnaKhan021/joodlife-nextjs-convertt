/**
 * Diagnostic endpoint that surfaces Payload init + user-create errors.
 *
 *   GET  /api/diag — env-var presence + boot status
 *   POST /api/diag/?action=create-user
 *     body: { name, email, password }
 *     → calls payload.create({ collection: "users", ... }) and returns
 *       the *real* error if it fails
 *
 * Read-only on env (length / first 12 chars only — never the full
 * value). Safe to leave deployed during integration.
 */
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function describe(value: string | undefined) {
  if (!value) return { present: false };
  return {
    present: true,
    length: value.length,
    startsWith: value.slice(0, 12) + (value.length > 12 ? "…" : ""),
  };
}

function resolveDb(): { name: string | null; value: string | null } {
  const exact = [
    "DATABASE_URI",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];
  for (const k of exact) {
    if (process.env[k]) return { name: k, value: process.env[k] as string };
  }
  for (const s of [
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ]) {
    const found = Object.keys(process.env).find(
      (k) => k.endsWith(s) && process.env[k]
    );
    if (found) return { name: found, value: process.env[found] as string };
  }
  return { name: null, value: null };
}

function envSnapshot() {
  const db = resolveDb();
  return {
    DATABASE_URL_resolved_from: db.name,
    DATABASE_URL: describe(db.value ?? undefined),
    PAYLOAD_SECRET: describe(process.env.PAYLOAD_SECRET),
    NEXT_PUBLIC_SERVER_URL: describe(process.env.NEXT_PUBLIC_SERVER_URL),
    PAYLOAD_PUBLIC_SERVER_URL: describe(process.env.PAYLOAD_PUBLIC_SERVER_URL),
    available_db_keys: Object.keys(process.env).filter(
      (k) => /DATABASE_URL|POSTGRES_URL|DATABASE_URI/.test(k) && process.env[k]
    ),
    NODE_ENV: process.env.NODE_ENV,
  };
}

function captureError(err: unknown) {
  const e = err as Error & {
    cause?: unknown;
    code?: string;
    data?: unknown;
  };
  return {
    name: e.name,
    message: e.message,
    code: e.code,
    cause:
      e.cause && typeof e.cause === "object"
        ? (e.cause as { message?: string; code?: string }).message ??
          JSON.stringify(e.cause).slice(0, 300)
        : undefined,
    data:
      typeof e.data === "object"
        ? JSON.stringify(e.data).slice(0, 300)
        : undefined,
    stack: e.stack?.split("\n").slice(0, 8).join("\n"),
  };
}

// Bump this when shipping a new diag — lets us confirm the function
// is the latest build.
const VERSION = "diag-v12-promote+payload-internals";

export async function GET() {
  const env = envSnapshot();

  if (!env.DATABASE_URL.present) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-env",
        env,
        hint: "No Postgres URL found. Add DATABASE_URI in Vercel.",
      },
      { status: 500 }
    );
  }

  try {
    const { getPayloadInstance } = await import("@/lib/payload");
    const payload = await getPayloadInstance();
    return NextResponse.json({
      version: VERSION,
      ok: true,
      env,
      payload: {
        booted: true,
        collections: Object.keys(payload.collections ?? {}),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        version: VERSION,
        ok: false,
        reason: "payload-init-failed",
        env,
        error: captureError(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // POST /api/diag?action=migrate — forces the Drizzle schema push so
  // the empty Postgres gets all Payload tables created up-front. Useful
  // when push: true on the adapter doesn't trigger because Payload 3.x
  // skips it under NODE_ENV=production by default.
  if (action === "migrate") {
    try {
      const { getPayloadInstance } = await import("@/lib/payload");
      const payload = await getPayloadInstance();
      const db = payload.db as unknown as {
        execute?: (args: { drizzle?: unknown; raw?: string }) => Promise<unknown>;
        drizzle?: { execute?: (sql: unknown) => Promise<unknown> };
      };

      if (!db.execute || !db.drizzle) {
        return NextResponse.json(
          {
            version: VERSION,
            ok: false,
            reason: "no-execute",
            hasExecute: typeof db.execute,
            hasDrizzle: typeof db.drizzle,
          },
          { status: 500 }
        );
      }

      // Hand-written SQL for the minimum schema Payload needs to render
      // /admin: users + users_sessions for auth, plus the Payload-internal
      // tables (preferences, locked documents, migrations, kv) that the
      // admin UI reads on every navigation.
      const SQL = `
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar,
          "role" varchar DEFAULT 'customer' NOT NULL,
          "email" varchar NOT NULL UNIQUE,
          "reset_password_token" varchar,
          "reset_password_expiration" timestamp(3) with time zone,
          "salt" varchar,
          "hash" varchar,
          "login_attempts" numeric DEFAULT 0,
          "lock_until" timestamp(3) with time zone,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
        CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
        CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" ("updated_at");

        CREATE TABLE IF NOT EXISTS "users_sessions" (
          "_order" integer NOT NULL,
          "_parent_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "id" varchar PRIMARY KEY NOT NULL,
          "created_at" timestamp(3) with time zone,
          "expires_at" timestamp(3) with time zone
        );
        CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" ("_order");
        CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" ("_parent_id");

        CREATE TABLE IF NOT EXISTS "payload_preferences" (
          "id" serial PRIMARY KEY NOT NULL,
          "key" varchar,
          "value" jsonb,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key");

        CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
          "id" serial PRIMARY KEY NOT NULL,
          "order" integer,
          "parent_id" integer NOT NULL REFERENCES "payload_preferences"("id") ON DELETE CASCADE,
          "path" varchar NOT NULL,
          "users_id" integer REFERENCES "users"("id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_id_idx" ON "payload_preferences_rels" ("parent_id");
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" ("path");

        CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
          "id" serial PRIMARY KEY NOT NULL,
          "global_slug" varchar,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" ("global_slug");

        CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
          "id" serial PRIMARY KEY NOT NULL,
          "order" integer,
          "parent_id" integer NOT NULL REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE,
          "path" varchar NOT NULL,
          "users_id" integer REFERENCES "users"("id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_id_idx" ON "payload_locked_documents_rels" ("parent_id");

        CREATE TABLE IF NOT EXISTS "payload_migrations" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar,
          "batch" numeric,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
      `;

      // Split + execute one statement at a time so a partial failure
      // doesn't leave a half-applied transaction.
      const statements = SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      const ran: string[] = [];
      for (const s of statements) {
        try {
          await db.execute({ drizzle: db.drizzle, raw: s });
          ran.push(s.slice(0, 80));
        } catch (e) {
          return NextResponse.json(
            {
              version: VERSION,
              ok: false,
              reason: "execute-failed",
              ran,
              failingStatement: s.slice(0, 200),
              error: captureError(e),
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        version: VERSION,
        ok: true,
        ran: ran.length,
        message: "users + users_sessions tables ensured",
      });
    } catch (err) {
      return NextResponse.json(
        {
          version: VERSION,
          ok: false,
          reason: "migrate-init-failed",
          error: captureError(err),
        },
        { status: 500 }
      );
    }
  }

  // Promote a user to admin role. Pass {email} in the body.
  if (action === "promote") {
    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, reason: "invalid-json" },
        { status: 400 }
      );
    }
    if (!body.email) {
      return NextResponse.json(
        { ok: false, reason: "missing-email" },
        { status: 400 }
      );
    }
    try {
      const { getPayloadInstance } = await import("@/lib/payload");
      const payload = await getPayloadInstance();
      const found = await payload.find({
        collection: "users",
        where: { email: { equals: body.email } },
        limit: 1,
        overrideAccess: true,
      });
      const target = found.docs[0];
      if (!target) {
        return NextResponse.json(
          { ok: false, reason: "user-not-found" },
          { status: 404 }
        );
      }
      const updated = await payload.update({
        collection: "users",
        id: target.id,
        data: { role: "admin" } as Record<string, unknown>,
        overrideAccess: true,
      });
      return NextResponse.json({
        version: VERSION,
        ok: true,
        promoted: {
          id: String(updated.id),
          email: updated.email,
          role: (updated as { role?: string }).role,
        },
      });
    } catch (err) {
      return NextResponse.json(
        {
          version: VERSION,
          ok: false,
          reason: "promote-failed",
          error: captureError(err),
        },
        { status: 500 }
      );
    }
  }

  if (action !== "create-user") {
    return NextResponse.json({ version: VERSION, ok: false, reason: "unknown-action" }, { status: 400 });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid-json" },
      { status: 400 }
    );
  }

  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json(
      { ok: false, reason: "missing-fields", needs: ["name", "email", "password"] },
      { status: 400 }
    );
  }

  try {
    const { getPayloadInstance } = await import("@/lib/payload");
    const payload = await getPayloadInstance();

    const created = await payload.create({
      collection: "users",
      data: { name, email, password },
      overrideAccess: true,
    });

    return NextResponse.json({
      ok: true,
      created: {
        id: String(created.id),
        email: created.email,
        name: (created as { name?: string }).name,
        role: (created as { role?: string }).role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: "create-failed",
        error: captureError(err),
      },
      { status: 500 }
    );
  }
}
