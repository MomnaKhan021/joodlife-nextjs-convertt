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
  // Only return safe metadata
  const startsWith = value.slice(0, 12);
  return {
    present: true,
    length: value.length,
    startsWith: startsWith + (value.length > 12 ? "…" : ""),
  };
}

export async function GET() {
  const env = {
    DATABASE_URI: describe(process.env.DATABASE_URI),
    PAYLOAD_SECRET: describe(process.env.PAYLOAD_SECRET),
    NEXT_PUBLIC_SERVER_URL: describe(process.env.NEXT_PUBLIC_SERVER_URL),
    PAYLOAD_PUBLIC_SERVER_URL: describe(process.env.PAYLOAD_PUBLIC_SERVER_URL),
    NODE_ENV: process.env.NODE_ENV,
  };

  // If the obvious vars are missing, surface that first
  if (!env.DATABASE_URI.present || !env.PAYLOAD_SECRET.present) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-env",
        env,
        hint: "Set DATABASE_URI and PAYLOAD_SECRET in Vercel env vars and redeploy.",
      },
      { status: 500 }
    );
  }

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
