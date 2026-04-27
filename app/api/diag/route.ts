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
const VERSION = "diag-v6-tmp-output";

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
        generateSchema?: (...args: unknown[]) => Promise<string> | string;
        execute?: (args: { drizzle?: unknown; raw?: string }) => Promise<unknown>;
        requireDrizzleKit?: () => unknown;
        migrateFresh?: (...args: unknown[]) => Promise<void>;
      };

      // Approach 1: try drizzle-kit push if available
      try {
        const drizzleKit = db.requireDrizzleKit?.() as
          | { pushSchema?: (...a: unknown[]) => Promise<unknown> }
          | undefined;
        if (drizzleKit?.pushSchema) {
          // Most postgres adapters internally call pushDevSchema; we
          // try the public surface above via methods list. Bypass.
        }
      } catch {
        /* ignore — drizzle-kit not bundled at runtime is normal */
      }

      // Approach 2: generate the schema SQL and run it via execute()
      // generateSchema() writes to disk by default — redirect to /tmp
      // since /var/task is read-only on Vercel.
      if (typeof db.generateSchema === "function") {
        const sql = await db.generateSchema({
          outputFile: "/tmp/payload-generated-schema.ts",
        } as Parameters<typeof db.generateSchema>[0]);
        if (typeof sql === "string" && sql.length > 0 && db.execute) {
          // Split on `;` boundaries, run each non-empty statement.
          // Drizzle's pg execute accepts { drizzle, raw } — try raw first.
          const statements = sql
            .split(/;\s*\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          let ranCount = 0;
          for (const stmt of statements) {
            try {
              await db.execute({ raw: stmt + ";" });
              ranCount++;
            } catch (e) {
              return NextResponse.json(
                {
                  version: VERSION,
                  ok: false,
                  reason: "execute-failed",
                  ranCount,
                  failingStatement: stmt.slice(0, 200),
                  error: captureError(e),
                },
                { status: 500 }
              );
            }
          }
          return NextResponse.json({
            version: VERSION,
            ok: true,
            ran: "generateSchema+execute",
            statementCount: statements.length,
          });
        }
        return NextResponse.json(
          {
            version: VERSION,
            ok: false,
            reason: "generateSchema-empty",
            sqlPreview:
              typeof sql === "string" ? sql.slice(0, 500) : typeof sql,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { version: VERSION, ok: false, reason: "no-generateSchema" },
        { status: 500 }
      );
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
