/**
 * Consultation REST surface.
 *
 * NOTE: We can't use a `[id]` dynamic sub-route here because Payload
 * registers a catch-all at `app/(payload)/api/[...slug]/route.ts` that
 * intercepts /api/consultations/<id> before our handler is reached.
 * Workaround: route everything through this file and use ?id=N for
 * the patch / read variants.
 *
 * POST /api/consultations
 *   Body: { fullName?, email?, phone?, dateOfBirth?, productSlug?,
 *           dose?, answers, status? }
 *   Creates a row. Anonymous starts allowed (the joodlife.com quiz
 *   pattern lets customers fill the questionnaire before signing in).
 *
 * PATCH /api/consultations?id=N
 *   Body: same shape as POST (all fields optional except `id`).
 *   Updates the row. Used by ConsultationFlow to persist progress on
 *   every step. COALESCE keeps untouched columns intact.
 *
 * GET /api/consultations?id=N
 *   Admin-only. Returns the row as structured camelCase JSON with the
 *   `answers` blob inline. For external integrators / clinician tools.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { addNoteToContact, fireHubSpot, upsertContact } from "@/lib/hubspot";

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

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

async function getDrizzle(): Promise<{
  payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  drizzle: DrizzleLike;
  sql: { raw: (s: string) => unknown };
}> {
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
  // Cast — TS can't carry the optional-chain narrowing across the
  // function boundary, but drizzle is the real Drizzle instance and
  // its method binding (`this`) must stay intact, so we don't wrap it.
  return {
    payload,
    drizzle: drizzle as DrizzleLike,
    sql: drizzleSql,
  };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";
}

function isAdmin(user: unknown): boolean {
  return Boolean(
    user &&
      typeof user === "object" &&
      (user as { role?: string }).role === "admin"
  );
}

/* ------------------------------------------------------------------ */
/* POST — create                                                       */
/* ------------------------------------------------------------------ */

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

  let userId: number | null = null;
  try {
    const { user } = await payload.auth({ headers: await nextHeaders() });
    if (user) userId = Number((user as unknown as { id: number | string }).id);
  } catch {
    // anonymous fine
  }

  const status = body.status === "draft" ? "draft" : "submitted";
  const answers = body.answers ?? {};

  try {
    const { drizzle, sql } = await getDrizzle();
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
    const result = (await drizzle.execute(sql.raw(stmt))) as
      | { rows?: Array<{ id: number }> }
      | Array<{ id: number }>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    const insertedId = rows[0]?.id ?? null;

    // Fire-and-forget HubSpot mirror: only push when the customer hits
    // Submit (status === 'submitted'). Drafts churn too much.
    if (status === "submitted" && body.email) {
      const [first, ...rest] = (body.fullName ?? "").split(" ");
      void fireHubSpot("consultation:contact", () =>
        upsertContact({
          email: body.email!,
          firstName: first || null,
          lastName: rest.join(" ") || null,
          phone: body.phone ?? null,
          extra: {
            jood_product_interest: body.productSlug ?? null,
            jood_consultation_status: "submitted",
            jood_consultation_id: insertedId ?? undefined,
          },
        })
      );

      // Compact answers as a Note so clinicians can read them inside HubSpot
      const noteLines = Object.entries(body.answers ?? {})
        .filter(([k]) => !k.startsWith("_")) // skip internal flags
        .map(([k, v]) => {
          const value = Array.isArray(v) ? v.join(", ") : String(v ?? "—");
          return `<b>${k}</b>: ${value}`;
        })
        .join("<br/>");
      const noteBody =
        `<p><b>JoodLife consultation submitted</b><br/>` +
        `Reference: #${insertedId} · Product: ${body.productSlug ?? "—"} · Dose: ${body.dose ?? "—"}</p>` +
        `<hr/><p>${noteLines}</p>`;
      void fireHubSpot("consultation:note", () =>
        addNoteToContact(body.email!, noteBody)
      );
    }

    return NextResponse.json({ ok: true, id: insertedId });
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

/* ------------------------------------------------------------------ */
/* PATCH — update by ?id=N                                             */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");
  const numericId = Number(idParam);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return NextResponse.json({ ok: false, error: "Missing or bad ?id" }, { status: 400 });
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
    const updatedId = rows[0].id;

    // Mirror to HubSpot when this PATCH is the final submit.
    if (status === "submitted" && body.email) {
      const [first, ...rest] = (body.fullName ?? "").split(" ");
      void fireHubSpot("consultation:contact", () =>
        upsertContact({
          email: body.email!,
          firstName: first || null,
          lastName: rest.join(" ") || null,
          phone: body.phone ?? null,
          extra: {
            jood_product_interest: body.productSlug ?? null,
            jood_consultation_status: "submitted",
            jood_consultation_id: updatedId,
          },
        })
      );
      const noteLines = Object.entries(body.answers ?? {})
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, v]) => {
          const value = Array.isArray(v) ? v.join(", ") : String(v ?? "—");
          return `<b>${k}</b>: ${value}`;
        })
        .join("<br/>");
      const noteBody =
        `<p><b>JoodLife consultation submitted</b><br/>` +
        `Reference: #${updatedId} · Product: ${body.productSlug ?? "—"} · Dose: ${body.dose ?? "—"}</p>` +
        `<hr/><p>${noteLines}</p>`;
      void fireHubSpot("consultation:note", () =>
        addNoteToContact(body.email!, noteBody)
      );
    }

    return NextResponse.json({ ok: true, id: updatedId });
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

/* ------------------------------------------------------------------ */
/* GET — admin JSON projection (?id=N) or ?list=1 for recent rows      */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 }
    );
  }

  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!isAdmin(user)) {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  const idParam = req.nextUrl.searchParams.get("id");
  const list = req.nextUrl.searchParams.get("list") === "1";
  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 50), 1),
    200
  );

  try {
    const { drizzle, sql } = await getDrizzle();

    if (idParam) {
      const numericId = Number(idParam);
      if (!Number.isFinite(numericId) || numericId < 1) {
        return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
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
      return NextResponse.json({ ok: true, consultation: format(rows[0]) });
    }

    if (list) {
      const result = (await drizzle.execute(
        sql.raw(`
          SELECT id, full_name, email, phone, date_of_birth, product_slug,
                 dose, answers, status, user_id, created_at, updated_at
          FROM "consultations"
          ORDER BY created_at DESC
          LIMIT ${limit}
        `)
      )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      const rows = Array.isArray(result) ? result : (result.rows ?? []);
      return NextResponse.json({
        ok: true,
        total: rows.length,
        consultations: rows.map(format),
      });
    }

    return NextResponse.json({
      ok: false,
      error: "Pass ?id=N or ?list=1",
    }, { status: 400 });
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

function format(r: Record<string, unknown>) {
  return {
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
}
