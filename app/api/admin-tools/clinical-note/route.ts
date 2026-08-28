/**
 * Clinical note — POST /api/admin-tools/clinical-note  { consultationId, note }
 *
 * A free-text pharmacist note recorded at the Clinical Check step (e.g. video
 * call / meeting notes, remarks before approving supply). Stored on the
 * consultation's answers JSON under `_clinical_note`, so it travels with the
 * patient and shows in Clinical Check. The card autosaves through here as staff
 * type. Admin/staff only.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return NextResponse.json(
      { ok: false, error: "Admin or staff role required" },
      { status: 403 },
    );
  }

  let body: { consultationId?: number | string; note?: unknown };
  try {
    body = (await req.json()) as { consultationId?: number | string; note?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const id = Number(body.consultationId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid consultationId" }, { status: 400 });
  }

  // Collapse whitespace and clamp the length.
  const note = String(body.note ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);

  try {
    const { drizzle, sql } = await getDrizzle();
    const mergeJson = JSON.stringify({ _clinical_note: note }).replace(/'/g, "''");
    await drizzle.execute(
      sql.raw(`
        UPDATE "consultations"
        SET answers = COALESCE(answers, '{}'::jsonb) || '${mergeJson}'::jsonb,
            updated_at = now()
        WHERE id = ${id}
      `),
    );
    return NextResponse.json({ ok: true, note });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
