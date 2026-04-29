/**
 * Per-row endpoints for an in-progress / completed consultation.
 *
 * PATCH /api/consultations/:id
 *   Body: same shape as POST. Updates the row's answers + status.
 *   Used by the storefront's ConsultationFlow to persist progress on
 *   every step without creating duplicate rows.
 *
 * GET /api/consultations/:id
 *   Returns the full row as structured JSON. Admin-only — customer
 *   health data should never leak to anonymous callers.
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

async function getDrizzle() {
  const payload = await getPayloadInstance();
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
  return { payload, drizzle, sql: drizzleSql };
}

function isAdmin(user: unknown): boolean {
  return Boolean(
    user &&
      typeof user === "object" &&
      (user as { role?: string }).role === "admin"
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status === "submitted" ? "submitted" : "draft";

  try {
    const { drizzle, sql } = await getDrizzle();
    const esc = (s: string | null | undefined) =>
      s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";

    // We update only the columns the caller actually provided, falling
    // back to keeping the existing value (COALESCE(EXCLUDED, current)).
    const stmt = `
      UPDATE "consultations" SET
        full_name = COALESCE(${esc(body.fullName)}, full_name),
        email = COALESCE(${esc(body.email)}, email),
        phone = COALESCE(${esc(body.phone)}, phone),
        date_of_birth = COALESCE(${esc(body.dateOfBirth)}, date_of_birth),
        product_slug = COALESCE(${esc(body.productSlug)}, product_slug),
        dose = COALESCE(${esc(body.dose)}, dose),
        answers = ${
          body.answers ? esc(JSON.stringify(body.answers)) + "::jsonb" : "answers"
        },
        status = ${esc(status)},
        updated_at = now()
      WHERE id = ${numericId}
      RETURNING id;
    `;
    const result = (await drizzle.execute(sql.raw(stmt))) as
      | { rows?: Array<{ id: number }> }
      | Array<{ id: number }>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Update failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  }

  try {
    const { payload, drizzle, sql } = await getDrizzle();

    // Admin-only — customer health data is private.
    const { user } = await payload.auth({ headers: await nextHeaders() });
    if (!isAdmin(user)) {
      return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
    }

    const result = (await drizzle.execute(
      sql.raw(`
        SELECT id, full_name, email, phone, date_of_birth, product_slug,
               dose, answers, status, user_id, created_at, updated_at
        FROM "consultations"
        WHERE id = ${numericId}
        LIMIT 1
      `)
    )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const r = rows[0];
    // Snake-case to camelCase + structured JSON for downstream consumers
    const formatted = {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      dateOfBirth: r.date_of_birth,
      productSlug: r.product_slug,
      dose: r.dose,
      status: r.status,
      userId: r.user_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      answers: r.answers ?? {},
    };
    return NextResponse.json({ ok: true, consultation: formatted });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Read failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
