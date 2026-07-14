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

// Serious symptoms that auto-flag a reorder for High Priority Pharmacist
// Review (matches REORDER_SERIOUS_SIDE_EFFECTS in flow-reorder.ts).
const SEVERE_REORDER_SYMPTOMS = new Set([
  "Severe stomach pain",
  "Pain under the ribs or yellow skin/eyes",
  "Severe dehydration",
  "Rash, swelling or difficulty breathing",
  "New or worsening low mood",
  "Something else that feels serious",
]);

/**
 * Returns a list of human-readable red flag reasons found in the answers.
 * Empty array = no red flags.
 */
function getReorderRedFlags(answers: Record<string, unknown>): string[] {
  const flags: string[] = [];

  const severity = String(answers.reorder_side_effect_severity ?? "");
  if (severity === "Severe") flags.push("⚠️ Side effect severity reported as SEVERE");

  const sideEffects = answers.reorder_side_effects;
  if (Array.isArray(sideEffects)) {
    const severe = sideEffects.filter((s) => SEVERE_REORDER_SYMPTOMS.has(String(s)));
    for (const s of severe) flags.push(`⚠️ Serious symptom: ${s}`);
  }

  // Pregnancy is a hard stop under the PGDs — any of the first three
  // pregnancy answers blocks supply pending pharmacist review.
  const pregnancy = String(answers.reorder_pregnancy_flag ?? "");
  if (["Pregnant", "Trying for a baby", "Breastfeeding"].includes(pregnancy))
    flags.push(`⚠️ Patient is ${pregnancy.toLowerCase()} — supply blocked pending review`);

  if (answers.reorder_new_clinical_event === "Yes") {
    const detail = String(answers.reorder_new_clinical_event_details ?? "").trim();
    flags.push(`⚠️ Something changed since last order${detail ? `: ${detail}` : ""}`);
  }

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

  const wantsCallback = String(answers.reorder_callback_request ?? "").startsWith("Yes");
  const callbackBanner = wantsCallback
    ? `<div style="background:#e7efe0;border:2px solid #2f5d2a;padding:10px 14px;border-radius:6px;margin-bottom:12px">
        <p style="margin:0;font-size:14px;font-weight:700;color:#2f5d2a">
          📞 CLINICIAN CALLBACK REQUESTED
        </p>
        <p style="margin:6px 0 0;font-size:13px;color:#333">
          The patient asked for a clinician to call them. Please add to the callback list.
        </p>
      </div>`
    : "";

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
    callbackBanner +
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

  // Reorder auto-approval: a submitted reorder with NO red flags does not need
  // pharmacist review — it bypasses the Clinical Queue and drops straight into
  // the Dispatch Queue (which reads answers._review_decision = 'approved').
  // Flagged reorders and new consultations still go through clinical review.
  const isReorder = body.productSlug === "reorder";
  const redFlags = isReorder && status === "submitted"
    ? getReorderRedFlags(body.answers ?? {})
    : [];
  const hasRedFlags = redFlags.length > 0;
  const autoApproveReorder = isReorder && status === "submitted" && !hasRedFlags;

  // The persisted status: auto-approved reorders go straight to 'approved' so
  // they leave the Clinical Queue (which lists submitted/reviewed) and are
  // picked up by the Dispatch Queue. `status` stays 'submitted' so the HubSpot
  // mirror below still fires.
  const dbStatus = autoApproveReorder ? "approved" : status;

  const answers: Record<string, unknown> = {
    ...(body.answers ?? {}),
    ...(autoApproveReorder
      ? {
          _review_decision: "approved",
          _review_reason: "Auto-approved reorder — no red flags",
          _reviewed_by: "Auto (system)",
          _reviewed_at: new Date().toISOString(),
        }
      : {}),
  };

  try {
    const { drizzle, sql } = await getDrizzle();
    const stmt = `
      INSERT INTO "consultations"
        (full_name, email, phone, date_of_birth, product_slug, dose,
         answers, status, user_id, updated_at, created_at)
      VALUES
        (${esc(body.fullName)}, ${esc(body.email)}, ${esc(body.phone)},
         ${esc(body.dateOfBirth)}, ${esc(body.productSlug)}, ${esc(body.dose)},
         ${esc(JSON.stringify(answers))}::jsonb, ${esc(dbStatus)},
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
      // isReorder / redFlags / hasRedFlags are computed above (drive auto-approval).
      const reorderStatus = hasRedFlags
        ? "needs_clinical_approval"
        : "reorder_approved";

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
          // Red-flagged reorders → "Needs Clinical Approval" (pharmacist queue).
          // Clean reorders auto-approve → "Clinically Approved" so they bypass
          // the clinical queue and land straight in Dispatch.
          const dealName = hasRedFlags
            ? `Reorder 🚨 RED FLAG — #${insertedId ?? "?"}`
            : `Reorder ✓ auto-approved — #${insertedId ?? "?"}`;
          await fireHubSpot("consultation:deal", () =>
            createDeal({
              name: dealName,
              amount: 0,
              contactEmail: body.email!,
              dealStage: hasRedFlags
                ? PATIENT_LIFECYCLE_STAGES.needsClinicalApproval
                : PATIENT_LIFECYCLE_STAGES.clinicallyApproved,
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
