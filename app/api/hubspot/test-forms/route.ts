/**
 * GET /api/hubspot/test-forms
 *
 * Admin-only diagnostic specifically for the Marketing Forms
 * pipeline. Returns the raw HubSpot API responses for:
 *   1. /marketing/v3/forms (list)            -> token has `forms` scope?
 *   2. The id auto-detection result           -> which form(s) we'd sync
 *   3. /form-integrations/v1/submissions/forms/{id}?limit=3
 *      for each matched form                  -> first 3 submissions raw
 *
 * If consultation sync is reporting 0 fetched / 0 inserted, this
 * endpoint pinpoints which step is failing in one shot:
 *
 *   - listForms returns 403  -> add the `forms` scope in the
 *     HubSpot Private App.
 *   - resolveConsultationFormIds returns []  -> the form name
 *     doesn't match the auto-detect regex; set
 *     HUBSPOT_CONSULTATION_FORM_ID explicitly.
 *   - submissions returns 403  -> same scope issue, or the
 *     restricted-access flag on the form.
 *   - submissions returns []  -> the form really has no entries.
 */
import { NextResponse, type NextRequest } from "next/server";

import { authorizeAdminOrCron } from "@/lib/hubspot-auth";
import {
  isHubSpotEnabled,
  listMarketingForms,
  resolveConsultationFormIds,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Probe =
  | {
      ok: true;
      formId: string;
      firstPage: { count: number; sample: unknown[]; hasMore: boolean };
    }
  | { ok: false; formId: string; status: number; error: string };

async function probeFormSubmissions(formId: string): Promise<Probe> {
  try {
    const res = await fetch(
      `https://api.hubapi.com/form-integrations/v1/submissions/forms/${encodeURIComponent(formId)}?limit=3`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN ?? ""}`,
        },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        formId,
        status: res.status,
        error: text.slice(0, 500),
      };
    }
    const j = (await res.json()) as {
      results?: Array<{
        submittedAt?: number;
        values?: Array<{ name: string; value: string }>;
      }>;
      paging?: { next?: { after?: string } };
    };
    const results = j.results ?? [];
    return {
      ok: true,
      formId,
      firstPage: {
        count: results.length,
        sample: results.slice(0, 3).map((r) => ({
          submittedAt: r.submittedAt,
          values: r.values,
        })),
        hasMore: !!j.paging?.next?.after,
      },
    };
  } catch (err) {
    return {
      ok: false,
      formId,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminOrCron(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }
  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "HUBSPOT_ACCESS_TOKEN not set" },
      { status: 400 }
    );
  }

  // 1. List all forms — confirms `forms` scope on the token
  const formsList = await listMarketingForms();

  // 2. Resolve which forms we'd actually sync
  const resolvedIds = await resolveConsultationFormIds();

  // 3. Probe each resolved form for submissions
  const probes: Probe[] = [];
  for (const id of resolvedIds) {
    probes.push(await probeFormSubmissions(id));
  }

  // 4. If auto-detect found nothing, ALSO probe a couple of forms
  //    by-name just to give the operator a hint when picking a form
  //    id manually.
  let unresolvedHint:
    | Array<{ id: string; name: string }>
    | { error: string }
    | undefined;
  if (resolvedIds.length === 0) {
    if (formsList.ok) {
      unresolvedHint = formsList.data.slice(0, 20).map((f) => ({
        id: f.id,
        name: f.name,
      }));
    } else {
      unresolvedHint = { error: "listMarketingForms failed — see formsList" };
    }
  }

  return NextResponse.json({
    ok: true,
    via: auth.via,
    env: {
      HUBSPOT_CONSULTATION_FORM_ID:
        process.env.HUBSPOT_CONSULTATION_FORM_ID ?? null,
      HUBSPOT_CONSULTATIONS_SOURCE:
        process.env.HUBSPOT_CONSULTATIONS_SOURCE ?? null,
    },
    formsList: formsList.ok
      ? {
          ok: true,
          count: formsList.data.length,
          forms: formsList.data.map((f) => ({
            id: f.id,
            name: f.name,
            archived: f.archived,
          })),
        }
      : {
          ok: false,
          status: formsList.status,
          error: formsList.error,
          hint:
            formsList.status === 403
              ? "Add the `forms` scope to your HubSpot Private App and refresh the access token."
              : undefined,
        },
    resolvedFormIds: resolvedIds,
    submissionsProbes: probes,
    unresolvedHint,
  });
}
