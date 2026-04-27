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
const VERSION = "diag-v3-push-check";

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
      const db = payload.db as unknown as Record<string, unknown>;
      // List all callable methods on the adapter so we can see exactly
      // which schema-push function exists in this Payload version.
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(db) ?? {}
      )
        .concat(Object.keys(db))
        .filter((k) => typeof (db as Record<string, unknown>)[k] === "function")
        .sort();
      const ran: string[] = [];

      // Try every plausible name in order
      for (const name of [
        "pushDevSchema",
        "pushSchema",
        "push",
        "createMigration",
        "migrate",
      ]) {
        if (typeof (db as Record<string, unknown>)[name] === "function") {
          try {
            await (db as Record<string, () => Promise<unknown>>)[name]();
            ran.push(name);
          } catch (e) {
            return NextResponse.json(
              {
                version: VERSION,
                ok: false,
                reason: `${name}-failed`,
                methods,
                ran,
                error: captureError(e),
              },
              { status: 500 }
            );
          }
        }
      }

      return NextResponse.json({
        version: VERSION,
        ok: ran.length > 0,
        ran,
        methods,
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
