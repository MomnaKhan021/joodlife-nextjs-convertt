/**
 * POST /api/admin-tools/clinical-review
 *
 * Pharmacist approves or rejects a flagged consultation/reorder.
 * Admin-only. Logs the decision (reviewer name, timestamp, reason)
 * into the consultation answers JSON and updates the status.
 * Also mirrors the decision to HubSpot (DEV-03 / DEV-07).
 *
 * Body: { id: number, decision: "approved"|"rejected", reason: string }
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import {
  fireHubSpot,
  upsertContact,
  addNoteToContact,
  updateDealStage,
  findDealsByContactEmail,
  PATIENT_LIFECYCLE_STAGES,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function esc(s: string | null | undefined): string {
  return s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";
}

function isAdmin(user: unknown): boolean {
  return Boolean(
    user &&
      typeof user === "object" &&
      (user as { role?: string }).role === "admin",
  );
}

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

export async function POST(req: NextRequest) {
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Payload init failed", detail: String(err) }, { status: 500 });
  }

  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  let body: { id?: number; decision?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { id, decision, reason } = body;
  if (!id || !decision || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ ok: false, error: "id, decision (approved|rejected) required" }, { status: 400 });
  }

  const reviewerName = String(
    (user as unknown as { name?: string; email?: string })?.name ??
    (user as unknown as { email?: string })?.email ??
    "Pharmacist",
  );
  const reviewedAt = new Date().toISOString();
  const newStatus = decision; // "approved" | "rejected"

  try {
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) throw new Error("drizzle unavailable");
    const db = drizzle as DrizzleLike;

    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const sql = drizzleSql;

    // Fetch current answers + email so we can log the decision and push to HubSpot
    const fetchRes = (await db.execute(
      sql.raw(
        `SELECT id, email, full_name, product_slug, answers FROM "consultations" WHERE id = ${Number(id)} LIMIT 1`,
      ),
    )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    const fetchRows = Array.isArray(fetchRes) ? fetchRes : (fetchRes.rows ?? []);
    if (fetchRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Consultation not found" }, { status: 404 });
    }
    const row = fetchRows[0];
    const email = String(row.email ?? "");
    const fullName = String(row.full_name ?? "");

    // Merge review details into the answers JSONB so they're stored and visible
    let existingAnswers: Record<string, unknown> = {};
    try {
      const raw = row.answers;
      existingAnswers = typeof raw === "object" && raw !== null
        ? (raw as Record<string, unknown>)
        : JSON.parse(String(raw ?? "{}"));
    } catch { /* keep empty */ }

    const updatedAnswers = {
      ...existingAnswers,
      _review_decision: decision,
      _review_reason: reason ?? "",
      _reviewed_by: reviewerName,
      _reviewed_at: reviewedAt,
    };

    // Update the consultation record
    await db.execute(
      sql.raw(
        `UPDATE "consultations"
         SET status = ${esc(newStatus)},
             answers = ${esc(JSON.stringify(updatedAnswers))}::jsonb,
             updated_at = now()
         WHERE id = ${Number(id)}`,
      ),
    );

    // Mirror to HubSpot — update contact status + add a decision note
    if (email) {
      const hubspotStatus = decision === "approved" ? "clinically_approved" : "clinically_rejected";
      const dealStage =
        decision === "approved"
          ? PATIENT_LIFECYCLE_STAGES.clinicallyApproved
          : PATIENT_LIFECYCLE_STAGES.clinicallyRejected;

      const decisionNote =
        `<p><b>Clinical review decision: ${decision.toUpperCase()}</b></p>` +
        `<p>Reviewed by: <b>${reviewerName}</b> at ${reviewedAt}</p>` +
        (reason ? `<p>Reason: ${reason}</p>` : "") +
        `<p>Consultation reference: #${id} · Patient: ${fullName}</p>`;

      // Fire-and-forget — don't block the response
      (async () => {
        // 1. Update contact properties
        await fireHubSpot("review:contact", () =>
          upsertContact({
            email,
            extra: {
              jood_consultation_status: hubspotStatus,
              jood_red_flag: decision === "approved" ? "false" : "true",
            },
          }),
        );

        // 2. Find the most recent deal for this patient and move its
        //    pipeline stage to Clinically Approved or Clinically Rejected
        //    so the board reflects the pharmacist's decision in real time.
        await fireHubSpot("review:deal-stage", async () => {
          const dealsRes = await findDealsByContactEmail(email);
          if (!dealsRes.ok || dealsRes.data.length === 0) return { ok: true, data: { id: "" } };
          // Move the newest deal (most recent reorder/consultation deal)
          const latestDeal = dealsRes.data[0];
          return updateDealStage(latestDeal.id, dealStage, {
            jood_consultation_status: hubspotStatus,
          });
        });

        // 3. Add decision note to contact timeline
        await fireHubSpot("review:note", () =>
          addNoteToContact(email, decisionNote),
        );
      })().catch(() => { /* non-fatal */ });
    }

    return NextResponse.json({ ok: true, id, decision, reviewedAt });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Review failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin-tools/clinical-review?status=pending|all
 *
 * Returns consultations that need clinical review.
 * "pending" (default) = submitted reorders + red-flagged + needs_clinical_approval contacts.
 */
export async function GET(req: NextRequest) {
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Payload init failed", detail: String(err) }, { status: 500 });
  }

  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  const showAll = req.nextUrl.searchParams.get("status") === "all";

  try {
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) throw new Error("drizzle unavailable");
    const db = drizzle as DrizzleLike;
    const { sql: drizzleSql } = (await import("drizzle-orm")) as {
      sql: { raw: (s: string) => unknown };
    };
    const sql = drizzleSql;

    // Pending = submitted consultations (new patients) + reorder submissions
    // waiting review. Exclude drafts and already-decided ones unless showAll.
    const whereClause = showAll
      ? `WHERE status NOT IN ('draft')`
      : `WHERE status IN ('submitted', 'reviewed')`;

    const result = (await db.execute(
      sql.raw(
        `SELECT id, full_name, email, phone, product_slug, dose, answers, status, created_at, updated_at
         FROM "consultations"
         ${whereClause}
         ORDER BY
           CASE
             WHEN answers->>'_review_decision' IS NULL AND
                  (answers->>'reorder_side_effect_severity' IN ('Severe','Moderate')
                   OR answers->>'reorder_pregnancy_flag' = 'Yes'
                   OR answers->>'reorder_new_clinical_event' = 'Yes'
                   OR answers->>'reorder_progress' = 'Not well')
             THEN 0
             ELSE 1
           END,
           created_at ASC
         LIMIT 200`,
      ),
    )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;

    const rows = Array.isArray(result) ? result : (result.rows ?? []);

    const consultations = rows.map((r) => {
      let answers: Record<string, unknown> = {};
      try {
        const raw = r.answers;
        answers = typeof raw === "object" && raw !== null
          ? (raw as Record<string, unknown>)
          : JSON.parse(String(raw ?? "{}"));
      } catch { /* keep empty */ }

      // Detect red flags
      const flags: string[] = [];
      const sev = String(answers.reorder_side_effect_severity ?? "");
      if (sev === "Severe") flags.push("Severe side effects");
      if (sev === "Moderate") flags.push("Moderate side effects");
      if (answers.reorder_pregnancy_flag === "Yes") flags.push("Pregnant / breastfeeding");
      if (answers.reorder_new_clinical_event === "Yes") flags.push("New clinical event");
      if (answers.reorder_progress === "Not well") flags.push("Treatment not going well");

      const isReorder = String(r.product_slug ?? "") === "reorder";
      const reviewed = answers._review_decision != null;

      return {
        id: r.id,
        fullName: r.full_name,
        email: r.email,
        phone: r.phone,
        productSlug: r.product_slug,
        dose: r.dose,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        isReorder,
        redFlags: flags,
        hasRedFlags: flags.length > 0,
        reviewed,
        reviewDecision: answers._review_decision ?? null,
        reviewReason: answers._review_reason ?? null,
        reviewedBy: answers._reviewed_by ?? null,
        reviewedAt: answers._reviewed_at ?? null,
        answers,
      };
    });

    const pending = consultations.filter((c) => !c.reviewed).length;

    return NextResponse.json({ ok: true, total: consultations.length, pending, consultations });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Fetch failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
