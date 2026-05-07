/**
 * GET /api/hubspot/diag
 *
 * Admin-only diagnostic. Reports:
 *   - HUBSPOT_ACCESS_TOKEN presence
 *   - HubSpot custom-object schemas the token can see
 *   - The auto-detected `consultations` object type slug
 *   - Live record counts for contacts, deals and the resolved
 *     consultations object
 *   - Local DB row counts for users / orders / consultations
 *   - Whether the new sync columns (hubspot_deal_id,
 *     hubspot_object_id) exist yet
 *
 * Use this when "I ran the sync but nothing appeared" to see which
 * step failed. The endpoint never writes — read-only.
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import {
  isHubSpotEnabled,
  listMarketingForms,
  listObjectSchemas,
  resolveConsultationFormIds,
  resolveConsultationsObjectType,
  countObjectRecords,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: SqlRaw;
} | null> {
  try {
    const payload = await getPayloadInstance();
    const drizzle = (
      payload.db as unknown as {
        drizzle?: { execute?: (q: unknown) => Promise<unknown> };
      }
    ).drizzle;
    if (!drizzle?.execute) return null;
    const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
    return { drizzle: drizzle as DrizzleLike, sql };
  } catch {
    return null;
  }
}

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: T[] }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

async function countRows(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  table: string
): Promise<number | string> {
  try {
    const res = await drizzle.execute(
      sql.raw(`SELECT COUNT(*)::int AS n FROM "${table}";`)
    );
    const rows = readRows<{ n: number }>(res);
    return rows[0]?.n ?? 0;
  } catch (err) {
    return `error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function columnExists(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  table: string,
  column: string
): Promise<boolean> {
  try {
    const res = await drizzle.execute(
      sql.raw(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = '${table}' AND column_name = '${column}'
         LIMIT 1;`
      )
    );
    return readRows(res).length > 0;
  } catch {
    return false;
  }
}

export async function GET() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  const out: Record<string, unknown> = {
    ok: true,
    hubspotEnabled: isHubSpotEnabled(),
    envObjectType: process.env.HUBSPOT_CONSULTATIONS_OBJECT_TYPE ?? null,
  };

  if (!isHubSpotEnabled()) {
    return NextResponse.json({
      ...out,
      error: "HUBSPOT_ACCESS_TOKEN not set",
    });
  }

  // 1. List schemas (so the operator can see which object slugs are available)
  const schemas = await listObjectSchemas();
  out.schemas = schemas.ok
    ? schemas.data.map((s) => ({
        name: s.name,
        objectTypeId: s.objectTypeId,
        labels: s.labels,
      }))
    : { error: schemas.error, status: schemas.status };

  // 2. Resolve which surface we'll use for consultations. Forms
  // wins when present (matches lib/hubspot.ts:listConsultationRecords).
  const consultationsObjectType = await resolveConsultationsObjectType();
  const consultationFormIds = await resolveConsultationFormIds();
  out.consultationsObjectType = consultationsObjectType;
  out.consultationFormIds = consultationFormIds;

  // 3. Live counts in HubSpot. Source order: Forms -> Appointments/
  // custom-object -> Notes. The diag mirrors that so the operator
  // can see at a glance which source the sync will actually use.
  const [contactsCount, dealsCount, consultationsCustomCount] =
    await Promise.all([
      countObjectRecords("contacts"),
      countObjectRecords("deals"),
      countObjectRecords(consultationsObjectType),
    ]);

  let consultationsCount: number | { error: string } = consultationsCustomCount.ok
    ? consultationsCustomCount.data
    : { error: consultationsCustomCount.error };
  let consultationsSource:
    | "forms"
    | "appointments"
    | "custom_object"
    | "notes"
    | "none" =
    consultationFormIds.length > 0
      ? "forms"
      : consultationsObjectType === "appointments"
        ? "appointments"
        : "custom_object";

  // If forms is the source, surface the matching form names + total
  // submission count by paging through each form once. For accuracy
  // and not blowing up the API budget, just sum a HEAD-style page
  // (limit 1, drained by paging) per form.
  if (consultationsSource === "forms") {
    try {
      const allForms = await listMarketingForms();
      out.matchedForms = allForms.ok
        ? allForms.data
            .filter((f) => consultationFormIds.includes(f.id))
            .map((f) => ({ id: f.id, name: f.name }))
        : [];
      // Best-effort: count submissions per form by fetching the
      // first page with limit=1 and reading paging.next.after to
      // detect whether more exist. We don't try to count exactly
      // (HubSpot's legacy submissions endpoint doesn't return a
      // total) — but at least confirm the form returns submissions.
      const perForm = await Promise.all(
        consultationFormIds.map(async (fid) => {
          const r = await fetch(
            `https://api.hubapi.com/form-integrations/v1/submissions/forms/${encodeURIComponent(fid)}?limit=1`,
            {
              headers: {
                Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN ?? ""}`,
              },
            }
          );
          if (!r.ok) return { id: fid, error: `HTTP ${r.status}` };
          const j = (await r.json()) as {
            results?: unknown[];
            paging?: { next?: { after?: string } };
          };
          return {
            id: fid,
            firstPage: (j.results ?? []).length,
            hasMore: !!j.paging?.next?.after,
          };
        })
      );
      out.formSubmissionsProbe = perForm;
      // Summarise count: sum of firstPage values is at least N. The
      // sync will paginate fully — this is just a "hey it returned
      // SOMETHING" indicator.
      const total = perForm.reduce(
        (acc: number, x) =>
          acc +
          (x && typeof x === "object" && "firstPage" in x
            ? Number(x.firstPage ?? 0)
            : 0),
        0
      );
      consultationsCount = total > 0 ? total : { error: "no submissions on first page" };
    } catch (err) {
      consultationsCount = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // If the custom object lookup failed, count consultation Notes
  // instead so the diag still shows a real number.
  if (
    !consultationsCustomCount.ok &&
    (/unable to infer object type/i.test(consultationsCustomCount.error) ||
      /unknown object type/i.test(consultationsCustomCount.error) ||
      consultationsCustomCount.status === 404)
  ) {
    consultationsSource = "notes";
    try {
      const notesSearch = await fetch(
        "https://api.hubapi.com/crm/v3/objects/notes/search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN ?? ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: "hs_note_body",
                    operator: "CONTAINS_TOKEN",
                    value: "JoodLife",
                  },
                ],
              },
            ],
            properties: ["hs_note_body"],
            limit: 1,
          }),
        }
      );
      if (notesSearch.ok) {
        const j = (await notesSearch.json()) as { total?: number };
        consultationsCount = Number(j.total ?? 0) || 0;
      } else {
        consultationsCount = {
          error: `notes search HTTP ${notesSearch.status}`,
        };
      }
    } catch (err) {
      consultationsCount = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  out.consultationsSource = consultationsSource;
  out.hubspotCounts = {
    contacts: contactsCount.ok
      ? contactsCount.data
      : { error: contactsCount.error },
    deals: dealsCount.ok ? dealsCount.data : { error: dealsCount.error },
    consultations: consultationsCount,
  };

  // 4. Local DB
  const d = await getDrizzle();
  if (!d) {
    out.local = { error: "drizzle unavailable" };
  } else {
    const [usersN, ordersN, consultsN, hasDealId, hasObjectId] = await Promise.all([
      countRows(d.drizzle, d.sql, "users"),
      countRows(d.drizzle, d.sql, "orders"),
      countRows(d.drizzle, d.sql, "consultations"),
      columnExists(d.drizzle, d.sql, "orders", "hubspot_deal_id"),
      columnExists(d.drizzle, d.sql, "consultations", "hubspot_object_id"),
    ]);
    out.local = {
      counts: { users: usersN, orders: ordersN, consultations: consultsN },
      schema: {
        orders_has_hubspot_deal_id: hasDealId,
        consultations_has_hubspot_object_id: hasObjectId,
      },
    };
  }

  return NextResponse.json(out);
}
