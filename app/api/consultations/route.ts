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
import { NextResponse, after, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { addNoteToContact, createDeal, fireHubSpot, mapConsultationStageId, upsertContact, PATIENT_LIFECYCLE_STAGES } from "@/lib/hubspot";

// Severe symptoms that auto-flag a reorder for clinical review (DEV-02).
const SEVERE_REORDER_SYMPTOMS = new Set([
  "Severe stomach (abdominal) pain, especially if it spreads to your back",
  "Severe pain in the upper-right tummy, yellowing of the skin or eyes, or fever",
  "Persistent vomiting or diarrhoea, or feeling very dehydrated",
  "Signs of an allergic reaction — rash, swelling of the face/lips/throat, or difficulty breathing",
  "New or worsening low mood, or any thoughts of harming yourself",
  "Any other symptom you would describe as severe",
]);

/**
 * Returns a list of human-readable red flag reasons found in the answers.
 * Empty array = no red flags.
 */
function getReorderRedFlags(answers: Record<string, unknown>): string[] {
  const flags: string[] = [];

  const severity = String(answers.reorder_side_effect_severity ?? "");
  if (severity === "Severe")   flags.push("⚠️ Side effect severity reported as SEVERE");
  if (severity === "Moderate") flags.push("⚠️ Side effect severity reported as MODERATE");

  const sideEffects = answers.reorder_side_effects;
  if (Array.isArray(sideEffects)) {
    const severe = sideEffects.filter((s) => SEVERE_REORDER_SYMPTOMS.has(String(s)));
    for (const s of severe) flags.push(`⚠️ Severe symptom: ${s}`);
  }

  if (answers.reorder_pregnancy_flag === "Yes")
    flags.push("⚠️ Patient is pregnant, trying to conceive, or breastfeeding");

  if (answers.reorder_new_clinical_event === "Yes") {
    const detail = String(answers.reorder_new_clinical_event_details ?? "").trim();
    flags.push(`⚠️ New clinical event since last order${detail ? `: ${detail}` : ""}`);
  }

  if (answers.reorder_progress === "Not well")
    flags.push("⚠️ Patient reports treatment is NOT going well");

  return flags;
}

function detectReorderRedFlags(answers: Record<string, unknown>): boolean {
  return getReorderRedFlags(answers).length > 0;
}

/**
 * Build the full HubSpot note body. For red-flagged reorders, a bold
 * alert banner is prepended so pharmacists (and HubSpot AI) see it
 * immediately without scrolling through the answers.
 */
function buildNoteBody(opts: {
  ref: number | null;
  productSlug?: string;
  dose?: string;
  answers: Record<string, unknown>;
  redFlags: string[];
}): string {
  const { ref, productSlug, dose, answers, redFlags } = opts;

  const answerLines = Object.entries(answers)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(", ") : String(v ?? "—");
      return `<b>${k}</b>: ${value}`;
    })
    .join("<br/>");

  const alertBanner = redFlags.length > 0
    ? `<div style="background:#fff3cd;border:2px solid #e65100;padding:12px 16px;border-radius:6px;margin-bottom:12px">
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#b71c1c">
          🚨 RED FLAG — CLINICAL REVIEW REQUIRED — DO NOT AUTO-SUPPLY 🚨
        </p>
        <p style="margin:0 0 6px;font-size:13px;color:#333">
          This reorder was automatically flagged. Supply is blocked until a named
          pharmacist approves or rejects below.
        </p>
        <ul style="margin:6px 0 0;padding-left:20px;font-size:13px;color:#333">
          ${redFlags.map((f) => `<li>${f}</li>`).join("")}
        </ul>
      </div>`
    : "";

  return (
    alertBanner +
    `<p><b>JoodLife reorder questionnaire submitted</b><br/>` +
    `Reference: #${ref ?? "?"} · Product: ${productSlug ?? "—"} · Dose: ${dose ?? "—"}</p>` +
    `<hr/><p>${answerLines}</p>`
  );
}

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
      const isReorder = body.productSlug === "reorder";
      const redFlags = isReorder ? getReorderRedFlags(body.answers ?? {}) : [];
      const hasRedFlags = redFlags.length > 0;
      const reorderStatus = hasRedFlags ? "needs_clinical_approval" : "reorder_submitted";

      // Build the HubSpot note — red-flagged reorders get a bold alert banner
      // at the top so pharmacists (and HubSpot AI) see the issue immediately.
      const noteBody = buildNoteBody({
        ref: insertedId,
        productSlug: body.productSlug,
        dose: body.dose,
        answers: body.answers ?? {},
        redFlags,
      });
      after(async () => {
        await fireHubSpot("consultation:contact", () =>
          upsertContact({
            email: body.email!,
            firstName: first || null,
            lastName: rest.join(" ") || null,
            phone: body.phone ?? null,
            extra: {
              jood_product_interest: body.productSlug ?? null,
              jood_consultation_status: isReorder ? reorderStatus : "submitted",
              jood_consultation_id: insertedId ?? undefined,
              ...(hasRedFlags ? { jood_red_flag: "true" } : {}),
            },
          }),
        );
        if (!isReorder) {
          // New consultation — create a Deal in "Consultation Booked" stage.
          await fireHubSpot("consultation:deal", () =>
            createDeal({
              name: `Consultation — ${body.productSlug ?? "general"} #${insertedId ?? "?"}`,
              amount: 0,
              contactEmail: body.email!,
              dealStage: mapConsultationStageId("submitted"),
              extra: {
                jood_product_interest: body.productSlug ?? "",
                jood_consultation_status: "submitted",
                jood_consultation_id: insertedId ?? undefined,
              },
            }),
          );
        } else {
          // ALL reorders (clean or red-flagged) → "Needs Clinical Approval"
          // in the Patient Order Lifecycle pipeline so the pharmacist queue
          // always shows them. Red-flagged ones get an alert note + jood_red_flag.
          const dealName = hasRedFlags
            ? `Reorder 🚨 RED FLAG — #${insertedId ?? "?"}`
            : `Reorder — #${insertedId ?? "?"}`;
          await fireHubSpot("consultation:deal", () =>
            createDeal({
              name: dealName,
              amount: 0,
              contactEmail: body.email!,
              dealStage: PATIENT_LIFECYCLE_STAGES.needsClinicalApproval,
              extra: {
                jood_product_interest: body.productSlug ?? "",
                jood_consultation_status: reorderStatus,
                jood_consultation_id: insertedId ?? undefined,
                ...(hasRedFlags ? { jood_red_flag: "true" } : {}),
              },
            }),
          );
        }
        await fireHubSpot("consultation:note", () =>
          addNoteToContact(body.email!, noteBody),
        );
      });
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
      const isReorder = body.productSlug === "reorder";
      const [first, ...rest] = (body.fullName ?? "").split(" ");
      const redFlags = isReorder ? getReorderRedFlags(body.answers ?? {}) : [];
      const hasRedFlags = redFlags.length > 0;
      const reorderStatus = hasRedFlags ? "needs_clinical_approval" : "reorder_submitted";

      const noteBody = buildNoteBody({
        ref: updatedId,
        productSlug: body.productSlug,
        dose: body.dose,
        answers: body.answers ?? {},
        redFlags,
      });
      after(async () => {
        await fireHubSpot("consultation:contact", () =>
          upsertContact({
            email: body.email!,
            firstName: first || null,
            lastName: rest.join(" ") || null,
            phone: body.phone ?? null,
            extra: {
              jood_product_interest: body.productSlug ?? null,
              jood_consultation_status: isReorder ? reorderStatus : "submitted",
              jood_consultation_id: updatedId,
              ...(hasRedFlags ? { jood_red_flag: "true" } : {}),
            },
          }),
        );
        if (isReorder) {
          // ALL reorders → Needs Clinical Approval in pipeline (DEV-03)
          const dealName = hasRedFlags
            ? `Reorder 🚨 RED FLAG — #${updatedId}`
            : `Reorder — #${updatedId}`;
          await fireHubSpot("consultation:deal", () =>
            createDeal({
              name: dealName,
              amount: 0,
              contactEmail: body.email!,
              dealStage: PATIENT_LIFECYCLE_STAGES.needsClinicalApproval,
              extra: {
                jood_product_interest: body.productSlug ?? "",
                jood_consultation_status: reorderStatus,
                jood_consultation_id: updatedId,
                ...(hasRedFlags ? { jood_red_flag: "true" } : {}),
              },
            }),
          );
        }
        await fireHubSpot("consultation:note", () =>
          addNoteToContact(body.email!, noteBody),
        );
      });
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
