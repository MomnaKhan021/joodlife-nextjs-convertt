/**
 * Diagnostic endpoint that surfaces the underlying Payload init error.
 * Hit `/api/_diag` to see exactly why Payload won't boot — env-var
 * presence checks + the raw error message from getPayload().
 *
 * This is intentionally read-only and only reports back the SHAPE of
 * env values (length / starts-with), never the values themselves, so
 * it's safe to leave deployed during early integration.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function describe(value: string | undefined) {
  if (!value) return { present: false };
  const startsWith = value.slice(0, 12);
  return {
    present: true,
    length: value.length,
    startsWith: startsWith + (value.length > 12 ? "…" : ""),
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
  const suffixes = [
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];
  for (const s of suffixes) {
    const found = Object.keys(process.env).find(
      (k) => k.endsWith(s) && process.env[k]
    );
    if (found) return { name: found, value: process.env[found] as string };
  }
  return { name: null, value: null };
}

export async function GET() {
  const db = resolveDb();
  const env = {
    DATABASE_URL_resolved_from: db.name,
    DATABASE_URL: describe(db.value ?? undefined),
    PAYLOAD_SECRET: describe(process.env.PAYLOAD_SECRET),
    NEXT_PUBLIC_SERVER_URL: describe(process.env.NEXT_PUBLIC_SERVER_URL),
    PAYLOAD_PUBLIC_SERVER_URL: describe(process.env.PAYLOAD_PUBLIC_SERVER_URL),
    // Helpful when an integration uses a prefix — we list candidate keys so
    // you can see at a glance which the runtime can see.
    available_db_keys: Object.keys(process.env).filter(
      (k) =>
        /DATABASE_URL|POSTGRES_URL|DATABASE_URI/.test(k) && process.env[k]
    ),
    NODE_ENV: process.env.NODE_ENV,
  };

  if (!db.value) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-env",
        env,
        hint: "No Postgres URL found. Add DATABASE_URI in Vercel (or rename your Neon integration to use DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING).",
      },
      { status: 500 }
    );
  }
  // PAYLOAD_SECRET is optional — payload.config.ts falls back to a
  // SHA-256 of DATABASE_URL when missing. We just note its presence
  // in the response for visibility.

  // Attempt to boot Payload and capture the underlying error
  try {
    const { getPayloadInstance } = await import("@/lib/payload");
    const payload = await getPayloadInstance();
    return NextResponse.json({
      ok: true,
      env,
      payload: {
        booted: true,
        collections: Object.keys(payload.collections ?? {}),
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      {
        ok: false,
        reason: "payload-init-failed",
        env,
        error: {
          name: e.name,
          message: e.message,
          // Drizzle / pg errors often include nested `cause`
          cause: (e as Error & { cause?: { message?: string } }).cause?.message,
          // First few lines of stack to help diagnose
          stack: e.stack?.split("\n").slice(0, 6).join("\n"),
        },
      },
      { status: 500 }
    );
  }
}
