/**
 * POST /api/consultations
 *   Body (JSON):
 *     { fullName?, email?, phone?, dateOfBirth?, productSlug?, dose?,
 *       answers: object, status?: "draft" | "submitted" }
 *
 *   Stores a consultation row. Anonymous starts allowed (matches the
 *   joodlife.com quiz UX where customers fill it out before signing in).
 *
 *   Direct SQL INSERT through Drizzle to sidestep Payload's REST
 *   pipeline — the answers JSON has free-form keys we don't want to
 *   force-validate on the way in.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  productSlug?: string;
  dose?: string;
  answers?: Record<string, unknown>;
  status?: "draft" | "submitted";
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 }
    );
  }

  // If the caller is logged in, link the row to that user.
  let userId: number | null = null;
  try {
    const { user } = await payload.auth({ headers: await nextHeaders() });
    if (user) userId = Number((user as unknown as { id: number | string }).id);
  } catch {
    // ignore — anonymous is fine
  }

  const status = body.status === "draft" ? "draft" : "submitted";
  const answers = body.answers ?? {};

  try {
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) {
      throw new Error("payload.db.drizzle.execute unavailable");
    }
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const esc = (s: string | null | undefined) =>
      s ? "'" + s.replace(/'/g, "''") + "'" : "NULL";

    const stmt = `
      INSERT INTO "consultations"
        (full_name, email, phone, date_of_birth, product_slug, dose,
         answers, status, user_id, updated_at, created_at)
      VALUES
        (${esc(body.fullName)}, ${esc(body.email)}, ${esc(body.phone)},
         ${esc(body.dateOfBirth)}, ${esc(body.productSlug)}, ${esc(body.dose)},
         ${esc(JSON.stringify(answers))}::jsonb, ${esc(status)},
         ${userId ?? "NULL"}, now(), now())
      RETURNING id;
    `;
    const result = (await drizzle.execute(drizzleSql.raw(stmt))) as
      | { rows?: Array<{ id: number }> }
      | Array<{ id: number }>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    return NextResponse.json({ ok: true, id: rows[0]?.id ?? null });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Insert failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
