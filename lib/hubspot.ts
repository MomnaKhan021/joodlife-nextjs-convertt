import "server-only";

/**
 * HubSpot CRM client.
 *
 * - All calls are gated on HUBSPOT_ACCESS_TOKEN. When the env var is
 *   missing, every helper is a no-op so the storefront keeps working
 *   without the integration configured.
 * - Errors are logged + swallowed (returned as { ok: false, ... }).
 *   Never throws into the caller — HubSpot outages must not break
 *   the user-facing flow (signup, consultation, checkout).
 * - Contacts are upserted by email (HubSpot's natural unique key).
 * - Deals + Notes are associated to the contact via the v4
 *   /associations/{toObjectType}/{toObjectId} default-association
 *   endpoint, which auto-applies the standard relationship type.
 *
 * Required HubSpot Private App scopes:
 *   crm.objects.contacts.read
 *   crm.objects.contacts.write
 *   crm.objects.deals.read
 *   crm.objects.deals.write
 *   crm.objects.notes.read     (only if you read notes back)
 *   crm.objects.notes.write
 */

const HUBSPOT_BASE = "https://api.hubapi.com";

type HubSpotResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

type HubSpotContact = {
  id: string;
  properties: Record<string, string | undefined>;
};

type HubSpotDeal = {
  id: string;
  properties: Record<string, string | undefined>;
};

type HubSpotNote = {
  id: string;
  properties: Record<string, string | undefined>;
};

function token(): string | null {
  return process.env.HUBSPOT_ACCESS_TOKEN ?? null;
}

export function isHubSpotEnabled(): boolean {
  return !!token();
}

/**
 * Read the granted scopes (and hub info) for the configured token.
 * Uses HubSpot's token-info endpoint, which takes the token in the path
 * and needs no auth header. Lets a diagnostic confirm whether the
 * private app has e.g. `crm.objects.notes.write` (required for weight-log
 * notes) without trial-and-error.
 */
export async function getHubSpotTokenInfo(): Promise<
  HubSpotResult<{ scopes: string[]; hubId?: number; appId?: number; userId?: number }>
> {
  const t = token();
  if (!t) return { ok: false, status: 0, error: "HUBSPOT_ACCESS_TOKEN missing" };
  try {
    const res = await fetch(
      `${HUBSPOT_BASE}/oauth/v1/access-tokens/${encodeURIComponent(t)}`,
      { cache: "no-store" }
    );
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          (data as { message?: string })?.message ?? text ?? "token info failed",
      };
    }
    const d = data as {
      scopes?: string[];
      hub_id?: number;
      app_id?: number;
      user_id?: number;
    };
    return {
      ok: true,
      data: {
        scopes: Array.isArray(d.scopes) ? d.scopes : [],
        hubId: d.hub_id,
        appId: d.app_id,
        userId: d.user_id,
      },
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function hsFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<HubSpotResult<T>> {
  const t = token();
  if (!t) {
    return { ok: false, status: 0, error: "HUBSPOT_ACCESS_TOKEN missing" };
  }
  try {
    const res = await fetch(`${HUBSPOT_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      // Always fresh — never cache HubSpot mutations
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = undefined;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const message =
        (data as { message?: string })?.message ??
        text.slice(0, 300) ??
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: message };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

export type ContactInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  /**
   * Free-form properties merged into the HubSpot payload. Useful for
   * custom contact properties you've configured in HubSpot.
   */
  extra?: Record<string, string | number | boolean | null | undefined>;
};

export async function searchContactByEmail(
  email: string
): Promise<HubSpotResult<HubSpotContact | null>> {
  if (!email) return { ok: false, status: 400, error: "email required" };
  const result = await hsFetch<{ results: HubSpotContact[] }>(
    `/crm/v3/objects/contacts/search`,
    {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [{ propertyName: "email", operator: "EQ", value: email }],
          },
        ],
        properties: ["email", "firstname", "lastname", "phone", "lifecyclestage"],
        limit: 1,
      }),
    }
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.results[0] ?? null };
}

/**
 * Delete a contact from HubSpot, keyed by email. Looks the contact up
 * first (HubSpot's DELETE needs the object id, not the email). Treats
 * "no matching contact" as success so admin deletes stay idempotent.
 */
export async function deleteContactByEmail(
  email: string
): Promise<HubSpotResult<{ deleted: boolean }>> {
  if (!email) return { ok: false, status: 400, error: "email required" };
  const found = await searchContactByEmail(email);
  if (!found.ok) return found;
  if (!found.data) return { ok: true, data: { deleted: false } };
  const res = await hsFetch<unknown>(
    `/crm/v3/objects/contacts/${found.data.id}`,
    { method: "DELETE" }
  );
  if (!res.ok) return res;
  return { ok: true, data: { deleted: true } };
}

/**
 * Create or update a contact keyed by email. Returns the contact id.
 *
 *   - If a contact already exists, PATCH its properties.
 *   - Otherwise POST a new contact.
 */
export async function upsertContact(
  input: ContactInput
): Promise<HubSpotResult<{ id: string; created: boolean }>> {
  if (!input.email) return { ok: false, status: 400, error: "email required" };

  // Standard, always-present HubSpot properties.
  const standard: Record<string, string> = {};
  // Custom jood_* properties — these only exist if they've been created in the
  // HubSpot account. If they haven't, HubSpot rejects the WHOLE write, so we
  // retry with just the standard fields (below) — the contact still lands.
  const extra: Record<string, string> = {};
  const put = (target: Record<string, string>, key: string, val: unknown) => {
    if (val === null || val === undefined) return;
    if (typeof val === "string" && !val.trim()) return;
    target[key] = String(val);
  };
  put(standard, "email", input.email);
  put(standard, "firstname", input.firstName);
  put(standard, "lastname", input.lastName);
  put(standard, "phone", input.phone);
  if (input.extra) {
    for (const [k, v] of Object.entries(input.extra)) put(extra, k, v);
  }

  const found = await searchContactByEmail(input.email);
  const id = found.ok && found.data ? found.data.id : null;
  const path = id
    ? `/crm/v3/objects/contacts/${id}`
    : `/crm/v3/objects/contacts`;
  const method = id ? "PATCH" : "POST";

  // First attempt with custom props.
  let res = await hsFetch<HubSpotContact>(path, {
    method,
    body: JSON.stringify({ properties: { ...standard, ...extra } }),
  });
  if (!res.ok && Object.keys(extra).length > 0) {
    // Ensure custom properties exist in HubSpot, then retry with them.
    await ensureConsultationContactProperties();
    res = await hsFetch<HubSpotContact>(path, {
      method,
      body: JSON.stringify({ properties: { ...standard, ...extra } }),
    });
  }
  // If still failing, fall back to standard fields only.
  if (!res.ok && Object.keys(extra).length > 0) {
    res = await hsFetch<HubSpotContact>(path, {
      method,
      body: JSON.stringify({ properties: standard }),
    });
  }
  if (!res.ok) return res;
  return { ok: true, data: { id: res.data.id, created: !id } };
}

/**
 * List contacts (paginated). Used by the admin "Pull from HubSpot"
 * sync action.
 */
export async function listContacts(
  after?: string,
  limit = 100
): Promise<
  HubSpotResult<{
    results: HubSpotContact[];
    nextAfter: string | null;
  }>
> {
  const params = new URLSearchParams({
    limit: String(limit),
    properties: "email,firstname,lastname,phone,lifecyclestage,createdate",
  });
  if (after) params.set("after", after);
  const res = await hsFetch<{
    results: HubSpotContact[];
    paging?: { next?: { after: string } };
  }>(`/crm/v3/objects/contacts?${params.toString()}`, { method: "GET" });
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      results: res.data.results,
      nextAfter: res.data.paging?.next?.after ?? null,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Deals (orders)                                                      */
/* ------------------------------------------------------------------ */

export type DealInput = {
  /** Display name shown in HubSpot's deal list. */
  name: string;
  /** Total order amount (£). HubSpot stores as a string, which we coerce. */
  amount: number;
  /** ISO `YYYY-MM-DD` close date. Defaults to today. */
  closeDate?: string;
  /** HubSpot pipeline + stage. Defaults to default pipeline / appointment. */
  pipeline?: string;
  dealStage?: string;
  /** Free-form custom-property merge. */
  extra?: Record<string, string | number | boolean | null | undefined>;
  /** Email of the contact this deal belongs to. The contact is upserted first. */
  contactEmail?: string;
};

/**
 * Pipeline routing — overridable via env so we can re-target without a code
 * change. Defaults to the JoodLife "Patient Order Lifecycle" pipeline
 * (Internal ID 3772760257) so every order/consultation lands there instead of
 * the generic Deals pipeline. When no explicit stage is provided, we omit the
 * `dealstage` property so HubSpot drops the deal on the pipeline's configured
 * default first stage (no need to hardcode a stage ID we don't have yet).
 */
const DEFAULT_PIPELINE = process.env.HUBSPOT_DEALS_PIPELINE || "3772760257";
// First-stage of the Patient Order Lifecycle pipeline. New orders/consultations
// land here; later events progress them via mapOrderStageId() below.
const DEFAULT_DEAL_STAGE = process.env.HUBSPOT_DEALS_DEFAULT_STAGE || "5269849324";

/**
 * Patient Order Lifecycle stage IDs (HubSpot pipeline 3772760257). Centralised
 * here so order/consultation status → pipeline stage is one source of truth.
 */
export const PATIENT_LIFECYCLE_STAGES = {
  newOrder: "5269849324",
  needsPhoneNumber: "5269849325",
  consultationBooked: "5269849326",
  needsClinicalApproval: "5269849327",
  clinicallyApproved: "5269849328",
  clinicallyRejected: "5269849333",
  dispatched: "5392688315",
} as const;

/**
 * Map a JoodLife order's status + payment_method into the right pipeline stage.
 * - cancelled / refunded → Clinically Rejected (lost)
 * - shipped / delivered  → Dispatched (won)
 * - paid                 → Clinically Approved (the moneyed, pre-ship stage)
 * - everything else      → New Order (first stage)
 */
export function mapOrderStageId(
  status: string | null | undefined,
  paymentStatus?: string | null | undefined,
): string {
  const s = String(status ?? "").toLowerCase();
  const ps = String(paymentStatus ?? "").toLowerCase();
  if (s === "cancelled" || ps === "refunded") return PATIENT_LIFECYCLE_STAGES.clinicallyRejected;
  if (s === "delivered" || s === "shipped" || s === "dispatched") return PATIENT_LIFECYCLE_STAGES.dispatched;
  if (s === "paid" || ps === "paid") return PATIENT_LIFECYCLE_STAGES.clinicallyApproved;
  return PATIENT_LIFECYCLE_STAGES.newOrder;
}

/**
 * Map a JoodLife consultation status into the right pipeline stage.
 * - approved → Clinically Approved
 * - rejected → Clinically Rejected
 * - submitted / reviewed → Needs clinical approval
 * - draft / anything else → Consultation Booked
 */
export function mapConsultationStageId(status: string | null | undefined): string {
  const s = String(status ?? "").toLowerCase();
  if (s === "approved") return PATIENT_LIFECYCLE_STAGES.clinicallyApproved;
  if (s === "rejected") return PATIENT_LIFECYCLE_STAGES.clinicallyRejected;
  if (s === "submitted" || s === "reviewed") return PATIENT_LIFECYCLE_STAGES.needsClinicalApproval;
  return PATIENT_LIFECYCLE_STAGES.consultationBooked;
}

export async function createDeal(
  input: DealInput
): Promise<HubSpotResult<{ id: string }>> {
  const standard: Record<string, string> = {
    dealname: input.name,
    amount: String(Math.round(input.amount * 100) / 100),
    pipeline: input.pipeline ?? DEFAULT_PIPELINE,
  };
  const stage = input.dealStage ?? DEFAULT_DEAL_STAGE;
  if (stage) standard.dealstage = stage;
  if (input.closeDate) standard.closedate = input.closeDate;
  // Custom jood_* properties — only exist if created in the HubSpot account.
  // If absent, HubSpot rejects the whole deal, so we retry without them below.
  const extra: Record<string, string> = {};
  if (input.extra) {
    for (const [k, v] of Object.entries(input.extra)) {
      if (v === null || v === undefined) continue;
      extra[k] = String(v);
    }
  }

  let created = await hsFetch<HubSpotDeal>(`/crm/v3/objects/deals`, {
    method: "POST",
    body: JSON.stringify({ properties: { ...standard, ...extra } }),
  });
  if (!created.ok && Object.keys(extra).length > 0) {
    // Retry with just the standard properties so the deal still gets created
    // even when the custom jood_* properties aren't configured in HubSpot.
    created = await hsFetch<HubSpotDeal>(`/crm/v3/objects/deals`, {
      method: "POST",
      body: JSON.stringify({ properties: standard }),
    });
  }
  if (!created.ok) return created;

  // Associate to the customer's contact (if email provided)
  if (input.contactEmail) {
    const contact = await upsertContact({ email: input.contactEmail });
    if (contact.ok) {
      await hsFetch(
        `/crm/v4/objects/deals/${created.data.id}/associations/default/contacts/${contact.data.id}`,
        { method: "PUT", body: JSON.stringify({}) }
      );
    }
  }

  return { ok: true, data: { id: created.data.id } };
}

/* ------------------------------------------------------------------ */
/* Deal stage updates                                                  */
/* ------------------------------------------------------------------ */

/**
 * Update the pipeline stage of an existing deal by its HubSpot deal ID.
 * Used by the clinical review flow to move deals when a pharmacist
 * approves or rejects a patient (DEV-03 / DEV-07).
 */
export async function updateDealStage(
  dealId: string,
  stageId: string,
  extraProps?: Record<string, string>,
): Promise<HubSpotResult<{ id: string }>> {
  const props: Record<string, string> = { dealstage: stageId, ...extraProps };
  const res = await hsFetch<{ id: string }>(
    `/crm/v3/objects/deals/${dealId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties: props }),
    },
  );
  return res;
}

/**
 * Find all deals associated with a contact (by email) in the Patient Order
 * Lifecycle pipeline. Returns the most-recently-created active deal first.
 * Used to locate which deal to move when a pharmacist approves/rejects.
 */
export async function findDealsByContactEmail(
  email: string,
): Promise<HubSpotResult<HubSpotDealRecord[]>> {
  // First resolve the contact id
  const contact = await searchContactByEmail(email);
  if (!contact.ok) return contact;
  if (!contact.data) return { ok: true, data: [] };

  const contactId = contact.data.id;

  type RawDeal = {
    id: string;
    properties: Record<string, string | undefined>;
  };

  // Fetch deals associated with this contact
  const res = await hsFetch<{
    results: RawDeal[];
    paging?: { next?: { after: string } };
  }>(
    `/crm/v3/objects/deals?limit=10&properties=${DEAL_PROPERTIES.join(",")}&associations=contacts`,
    { method: "GET" },
  );

  // HubSpot v3 doesn't support filtering by contact in a simple GET —
  // use the associations endpoint instead
  const assocRes = await hsFetch<{
    results: Array<{ id: string; type: string }>;
  }>(
    `/crm/v4/objects/contacts/${contactId}/associations/deals`,
    { method: "GET" },
  );

  if (!assocRes.ok) return { ok: true, data: [] };

  const dealIds = (assocRes.data.results ?? []).map((r) => r.id);
  if (dealIds.length === 0) return { ok: true, data: [] };

  // Fetch full deal records for these IDs (batch read)
  const batchRes = await hsFetch<{ results: RawDeal[] }>(
    `/crm/v3/objects/deals/batch/read`,
    {
      method: "POST",
      body: JSON.stringify({
        inputs: dealIds.map((id) => ({ id })),
        properties: DEAL_PROPERTIES,
      }),
    },
  );

  if (!batchRes.ok) return { ok: true, data: [] };

  const deals: HubSpotDealRecord[] = (batchRes.data.results ?? [])
    .filter((d) => {
      const p = d.properties?.pipeline ?? "";
      return !p || p === DEFAULT_PIPELINE;
    })
    .map((d) => ({
      id: d.id,
      properties: d.properties ?? {},
    }))
    .sort((a, b) => {
      const ta = a.properties?.createdate ? new Date(a.properties.createdate).getTime() : 0;
      const tb = b.properties?.createdate ? new Date(b.properties.createdate).getTime() : 0;
      return tb - ta; // newest first
    });

  return { ok: true, data: deals };
}

/* ------------------------------------------------------------------ */
/* Notes (consultation answers)                                        */
/* ------------------------------------------------------------------ */

/**
 * Attaches a Note engagement to a contact. We use this to dump the
 * customer's consultation answers into HubSpot so clinicians have
 * the full context inside the CRM without leaving the contact view.
 */
export async function addNoteToContact(
  contactEmail: string,
  body: string
): Promise<HubSpotResult<{ id: string }>> {
  if (!contactEmail) {
    return { ok: false, status: 400, error: "contactEmail required" };
  }
  const contact = await upsertContact({ email: contactEmail });
  if (!contact.ok) return contact;

  const note = await hsFetch<HubSpotNote>(`/crm/v3/objects/notes`, {
    method: "POST",
    body: JSON.stringify({
      properties: {
        hs_note_body: body,
        // HubSpot expects timestamp in ms
        hs_timestamp: String(Date.now()),
      },
    }),
  });
  if (!note.ok) return note;

  await hsFetch(
    `/crm/v4/objects/notes/${note.data.id}/associations/default/contacts/${contact.data.id}`,
    { method: "PUT", body: JSON.stringify({}) }
  );

  return { ok: true, data: { id: note.data.id } };
}

/* ------------------------------------------------------------------ */
/* Weight logs → contact properties                                    */
/* ------------------------------------------------------------------ */

/** Custom contact property names used to store weight-log data. */
export const WEIGHT_PROP_LATEST = "jood_latest_weight_kg";
export const WEIGHT_PROP_DATE = "jood_last_weight_logged_at";
export const WEIGHT_PROP_HISTORY = "jood_weight_log_history";

/**
 * Create the Jood consultation custom contact properties if they don't exist.
 * Called automatically inside `upsertContact` before any retry, so the
 * properties are always registered before we write them.
 * 409 = already exists (fine). 403 = no schema scope (manual creation needed).
 */
let _consultationPropsEnsured = false;
export async function ensureConsultationContactProperties(): Promise<
  HubSpotResult<{ ensured: boolean }>
> {
  if (_consultationPropsEnsured) return { ok: true, data: { ensured: true } };
  const defs = [
    {
      name: "jood_consultation_status",
      label: "Jood Consultation Status",
      description: "Current status of the patient's consultation or reorder",
      type: "enumeration",
      fieldType: "select",
      groupName: "contactinformation",
      options: [
        { label: "Submitted", value: "submitted", displayOrder: 0, hidden: false },
        { label: "Reorder Submitted", value: "reorder_submitted", displayOrder: 1, hidden: false },
        { label: "Needs Clinical Approval", value: "needs_clinical_approval", displayOrder: 2, hidden: false },
        { label: "Clinically Approved", value: "clinically_approved", displayOrder: 3, hidden: false },
        { label: "Clinically Rejected", value: "clinically_rejected", displayOrder: 4, hidden: false },
        { label: "Approved", value: "approved", displayOrder: 5, hidden: false },
        { label: "Rejected", value: "rejected", displayOrder: 6, hidden: false },
      ],
    },
    {
      name: "jood_red_flag",
      label: "Jood Red Flag",
      description: "True when a reorder questionnaire has clinical red flags",
      type: "enumeration",
      fieldType: "booleancheckbox",
      groupName: "contactinformation",
      options: [
        { label: "Yes", value: "true", displayOrder: 0, hidden: false },
        { label: "No", value: "false", displayOrder: 1, hidden: false },
      ],
    },
    {
      name: "jood_consultation_id",
      label: "Jood Consultation ID",
      description: "Internal consultation record ID",
      type: "string",
      fieldType: "text",
      groupName: "contactinformation",
    },
    {
      name: "jood_product_interest",
      label: "Jood Product Interest",
      description: "Product slug the patient expressed interest in",
      type: "string",
      fieldType: "text",
      groupName: "contactinformation",
    },
  ];
  for (const def of defs) {
    await hsFetch(`/crm/v3/properties/contacts`, {
      method: "POST",
      body: JSON.stringify(def),
    });
  }
  _consultationPropsEnsured = true;
  return { ok: true, data: { ensured: true } };
}

// Fire once at cold-start so the properties exist before the first contact write.
if (typeof process !== "undefined" && process.env.HUBSPOT_ACCESS_TOKEN) {
  ensureConsultationContactProperties().catch(() => { /* non-fatal */ });
}

/**
 * Create the weight custom contact properties if they don't exist yet.
 * Needs the `crm.schemas.contacts.write` scope. Best-effort: if the scope
 * is missing, the properties must be created once by hand in HubSpot
 * (Settings → Properties) with these exact internal names — the write
 * below then populates them with `crm.objects.contacts.write` alone.
 */
export async function ensureWeightContactProperties(): Promise<
  HubSpotResult<{ ensured: boolean }>
> {
  const defs = [
    {
      name: WEIGHT_PROP_LATEST,
      label: "Latest weight (kg)",
      type: "number",
      fieldType: "number",
      groupName: "contactinformation",
    },
    {
      name: WEIGHT_PROP_DATE,
      label: "Last weight logged",
      type: "date",
      fieldType: "date",
      groupName: "contactinformation",
    },
    {
      name: WEIGHT_PROP_HISTORY,
      label: "Weight log history",
      type: "string",
      fieldType: "textarea",
      groupName: "contactinformation",
    },
  ];
  for (const def of defs) {
    // 409 = already exists (fine); 403 = no schema scope (fall back to manual).
    await hsFetch(`/crm/v3/properties/contacts`, {
      method: "POST",
      body: JSON.stringify(def),
    });
  }
  return { ok: true, data: { ensured: true } };
}

/**
 * Sync one weight-log entry to the customer's HubSpot contact as
 * properties (a "column" on the contact record), using only
 * `crm.objects.contacts.write`:
 *   - jood_latest_weight_kg     — most recent weight
 *   - jood_last_weight_logged_at — date of that reading
 *   - jood_weight_log_history    — appended "YYYY-MM-DD: N kg" log
 *
 * Reads the existing history first so the full record is preserved in
 * one field (no duplicate rows; each call appends one line).
 */
export async function syncWeightLogToContact(input: {
  email: string;
  weightKg: number;
  loggedAt?: string | null;
  customerId?: string | number | null;
}): Promise<HubSpotResult<{ id: string }>> {
  if (!input.email) return { ok: false, status: 400, error: "email required" };

  await ensureWeightContactProperties();

  // Date as midnight-UTC epoch ms (HubSpot date-property format).
  const dateOnly = (input.loggedAt
    ? new Date(input.loggedAt)
    : new Date()
  )
    .toISOString()
    .slice(0, 10);
  const dateMs = Date.parse(`${dateOnly}T00:00:00.000Z`);

  // Read current history to append to it.
  let existingHistory = "";
  const search = await hsFetch<{
    results: Array<{ id: string; properties: Record<string, string | null> }>;
  }>(`/crm/v3/objects/contacts/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "email", operator: "EQ", value: input.email }] },
      ],
      properties: [WEIGHT_PROP_HISTORY],
      limit: 1,
    }),
  });
  if (search.ok && search.data.results?.[0]) {
    existingHistory =
      search.data.results[0].properties?.[WEIGHT_PROP_HISTORY] ?? "";
  }
  const line = `${dateOnly}: ${input.weightKg} kg`;
  let history = existingHistory ? `${existingHistory}\n${line}` : line;
  // Keep the field within HubSpot's textarea limit.
  if (history.length > 60000) history = history.split("\n").slice(-300).join("\n");

  return upsertContact({
    email: input.email,
    extra: {
      [WEIGHT_PROP_LATEST]: input.weightKg,
      [WEIGHT_PROP_DATE]: dateMs,
      [WEIGHT_PROP_HISTORY]: history,
    },
  });
}

/**
 * Read back the weight properties currently stored on a contact — so a
 * diagnostic can confirm the values actually landed in HubSpot (vs. just
 * not being shown on the record layout).
 */
export async function readContactWeightProps(
  email: string
): Promise<
  HubSpotResult<{ contactId: string | null; props: Record<string, string | null> }>
> {
  if (!email) return { ok: false, status: 400, error: "email required" };
  const res = await hsFetch<{
    results: Array<{ id: string; properties: Record<string, string | null> }>;
  }>(`/crm/v3/objects/contacts/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
      ],
      properties: [WEIGHT_PROP_LATEST, WEIGHT_PROP_DATE, WEIGHT_PROP_HISTORY],
      limit: 1,
    }),
  });
  if (!res.ok) return res;
  const c = res.data.results?.[0];
  return {
    ok: true,
    data: { contactId: c?.id ?? null, props: c?.properties ?? {} },
  };
}

/* ------------------------------------------------------------------ */
/* Bulk-pull helpers — admin sync endpoints                            */
/* ------------------------------------------------------------------ */

/**
 * The full set of deal properties we read on the admin Orders sync.
 * Most of these are the `jood_*` custom properties that
 * /api/checkout writes when an order is placed; the rest are
 * standard HubSpot deal columns used as fallbacks.
 */
const DEAL_PROPERTIES = [
  "dealname",
  "amount",
  "dealstage",
  "pipeline",
  "closedate",
  "createdate",
  "hs_lastmodifieddate",
  "jood_order_number",
  "jood_order_status",
  "jood_order_items",
  "jood_payment_method",
  "jood_customer_email",
  "jood_customer_name",
  "jood_customer_phone",
  "jood_shipping_address",
  "jood_order_notes",
  "jood_discount_amount",
] as const;

export type HubSpotDealRecord = {
  id: string;
  properties: Record<string, string | undefined>;
  /** Email of the first associated contact, or null. */
  contactEmail?: string | null;
  /** First associated contact id, or null. */
  contactId?: string | null;
};

/**
 * Orders synced from Shopify (via the Checkify integration) don't use our
 * `jood_shipping_address` property — they store the delivery address in their
 * own deal property (e.g. "Shipping/billing address"). We can't hardcode that
 * internal name safely (requesting a non-existent property 400s the whole
 * fetch), so discover the deal's address-type property names at runtime and
 * cache them. Returns internal names to add to the requested property list.
 */
let _cachedDealAddressProps: string[] | null = null;

async function discoverDealAddressProps(): Promise<string[]> {
  if (_cachedDealAddressProps) return _cachedDealAddressProps;
  const res = await hsFetch<{ results: Array<{ name: string }> }>(
    `/crm/v3/properties/deals`,
    { method: "GET" },
  );
  if (!res.ok) {
    // Don't cache a failure — allow a later retry.
    return [];
  }
  const re = /(ship|shipping|delivery|billing).*address|address.*(ship|delivery|billing)|^address$|_address$/i;
  const names = (res.data.results ?? [])
    .map((p) => p.name)
    .filter((n) => re.test(n) && n !== "jood_shipping_address");
  _cachedDealAddressProps = names;
  return names;
}

/**
 * Picks the best delivery address from a deal's properties. Prefers our own
 * `jood_shipping_address`, then falls back to any address-type property the
 * integration populated (Shopify/Checkify orders), ranked shipping > delivery
 * > billing/other. Returns "" when no address exists.
 */
export function pickDealShippingAddress(
  props: Record<string, string | undefined>,
): string {
  const direct = (props.jood_shipping_address ?? "").trim();
  if (direct) return direct;

  const rank = (k: string): number => {
    const l = k.toLowerCase();
    if (/shipping.*address|shipping_billing|ship_to|ship.*address/.test(l)) return 3;
    if (/delivery.*address/.test(l)) return 2;
    if (/billing.*address|_address$|^address$/.test(l)) return 1;
    return 0;
  };

  let best = "";
  let bestRank = 0;
  for (const key of Object.keys(props)) {
    const r = rank(key);
    if (r > bestRank) {
      const v = (props[key] ?? "").trim();
      if (v) {
        best = v;
        bestRank = r;
      }
    }
  }
  return best;
}

/**
 * Paginated list of deals with their `jood_*` order properties +
 * the email of the first associated contact (used as the customer
 * email fallback when the deal lacks `jood_customer_email`).
 */
export async function listDeals(
  after?: string,
  limit = 100
): Promise<
  HubSpotResult<{
    results: HubSpotDealRecord[];
    nextAfter: string | null;
  }>
> {
  const extraAddressProps = await discoverDealAddressProps();
  const params = new URLSearchParams({
    limit: String(limit),
    properties: [...DEAL_PROPERTIES, ...extraAddressProps].join(","),
    associations: "contacts",
  });
  if (after) params.set("after", after);

  type RawDeal = {
    id: string;
    properties: Record<string, string | undefined>;
    associations?: {
      contacts?: { results?: Array<{ id: string }> };
    };
  };

  const res = await hsFetch<{
    results: RawDeal[];
    paging?: { next?: { after: string } };
  }>(`/crm/v3/objects/deals?${params.toString()}`, { method: "GET" });
  if (!res.ok) return res;

  // Collect every distinct contact id across the page so we can resolve
  // emails in ONE batch read instead of 100 individual GETs (avoids the
  // HubSpot rate limit and the per-call latency that capped earlier
  // syncs at the first batch).
  const contactIds: string[] = [];
  for (const d of res.data.results) {
    const cid = d.associations?.contacts?.results?.[0]?.id;
    if (cid && !contactIds.includes(cid)) contactIds.push(cid);
  }

  const emailById = new Map<string, string>();
  if (contactIds.length > 0) {
    // /batch/read accepts up to 100 ids per call, which matches our
    // page size. If a future page bump exceeds 100 we'd need to chunk.
    const batch = await hsFetch<{
      results: Array<{ id: string; properties: Record<string, string> }>;
    }>(`/crm/v3/objects/contacts/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        properties: ["email", "firstname", "lastname", "phone"],
        inputs: contactIds.map((id) => ({ id })),
      }),
    });
    if (batch.ok) {
      for (const c of batch.data.results) {
        if (c.properties?.email) emailById.set(c.id, c.properties.email);
      }
    }
  }

  const enriched: HubSpotDealRecord[] = res.data.results.map((d) => {
    const contactId = d.associations?.contacts?.results?.[0]?.id ?? null;
    return {
      id: d.id,
      properties: d.properties,
      contactId,
      contactEmail: contactId ? (emailById.get(contactId) ?? null) : null,
    };
  });

  return {
    ok: true,
    data: {
      results: enriched,
      nextAfter: res.data.paging?.next?.after ?? null,
    },
  };
}

/**
 * Fetch the full contact record for a contact id (used to fall back
 * to firstname/lastname/phone when the deal lacks `jood_customer_*`
 * properties).
 */
export async function getContactById(
  contactId: string
): Promise<HubSpotResult<HubSpotContact | null>> {
  const res = await hsFetch<HubSpotContact>(
    `/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,phone,address,city,state,zip,country`,
    { method: "GET" }
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data ?? null };
}

/* ------------------------------------------------------------------ */
/* Video consultation (Google Meet) links                             */
/*                                                                    */
/* After a consult is booked, HubSpot stores the video-call join URL  */
/* on the associated Meeting/Appointment object. The exact property   */
/* varies by portal, so we read a generous set of candidates and pull */
/* out whatever looks like a Meet/Zoom/Teams URL.                     */
/* ------------------------------------------------------------------ */
const MEETING_URL_PROPS = [
  "hs_meeting_location",
  "hs_meeting_external_url",
  "hs_meeting_body",
  "hs_appointment_location",
  "join_url",
  "meeting_link",
  "google_meet_link",
  "conference_url",
  "location",
] as const;

const MEETING_TIME_PROPS = [
  "hs_meeting_start_time",
  "hs_appointment_start",
  "hs_timestamp",
] as const;

const URL_RE = /https?:\/\/[^\s"'<>)]+/i;

function extractMeetUrl(props: Record<string, string | undefined>): string | null {
  const values = MEETING_URL_PROPS.map((k) => props[k]).filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  // Prefer a real video-conferencing URL; fall back to any URL present.
  const preferred =
    values.find((v) => /meet\.google\.com|zoom\.us|teams\.microsoft|hangouts/i.test(v)) ??
    values.find((v) => URL_RE.test(v));
  if (!preferred) return null;
  const m = preferred.match(URL_RE);
  return m ? m[0] : null;
}

export type MeetingLink = { joinUrl: string | null; startsAt: string | null };

/**
 * Finds the Google Meet (or other video-call) join link for a patient by
 * email: locates their HubSpot contact, then reads meetings/appointments
 * associated with that contact and returns the latest one carrying a URL.
 * Returns { joinUrl: null } (ok) when nothing is booked yet.
 */
export async function getMeetingLinkForContact(
  email: string,
): Promise<HubSpotResult<MeetingLink>> {
  if (!email) return { ok: false, status: 400, error: "email required" };
  const contact = await searchContactByEmail(email);
  if (!contact.ok) return { ok: false, status: contact.status, error: contact.error };
  if (!contact.data) return { ok: true, data: { joinUrl: null, startsAt: null } };
  const contactId = contact.data.id;
  const propsToRead = [...MEETING_URL_PROPS, ...MEETING_TIME_PROPS];

  for (const objType of ["meetings", "appointments"] as const) {
    const assoc = await hsFetch<{ results: { toObjectId?: string; id?: string }[] }>(
      `/crm/v4/objects/contacts/${contactId}/associations/${objType}?limit=100`,
      { method: "GET" },
    );
    if (!assoc.ok || !assoc.data?.results?.length) continue;
    const ids = assoc.data.results
      .map((r) => String(r.toObjectId ?? r.id ?? ""))
      .filter(Boolean);
    if (!ids.length) continue;

    const batch = await hsFetch<{
      results: { id: string; properties: Record<string, string | undefined> }[];
    }>(`/crm/v3/objects/${objType}/batch/read`, {
      method: "POST",
      body: JSON.stringify({ properties: propsToRead, inputs: ids.map((id) => ({ id })) }),
    });
    if (!batch.ok || !batch.data?.results?.length) continue;

    let best: MeetingLink | null = null;
    for (const rec of batch.data.results) {
      const url = extractMeetUrl(rec.properties);
      if (!url) continue;
      const startsAt =
        MEETING_TIME_PROPS.map((k) => rec.properties[k]).find(Boolean) ?? null;
      if (!best || (startsAt && (!best.startsAt || startsAt > best.startsAt))) {
        best = { joinUrl: url, startsAt };
      }
    }
    if (best) return { ok: true, data: best };
  }
  return { ok: true, data: { joinUrl: null, startsAt: null } };
}

/**
 * Bulk variant of getMeetingLinkForContact used to sort the Clinical Queue by
 * booked consultation time. Returns a map of email -> scheduled start (ISO
 * string or null), fetched with a small concurrency cap to stay within
 * HubSpot rate limits. Emails with no booked meeting map to null.
 */
export async function getMeetingTimesForEmails(
  emails: string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const out: Record<string, string | null> = {};
  const CONCURRENCY = 5;
  let i = 0;
  async function worker() {
    while (i < unique.length) {
      const email = unique[i++];
      try {
        const res = await getMeetingLinkForContact(email);
        out[email] = res.ok ? res.data.startsAt : null;
      } catch {
        out[email] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, worker));
  return out;
}

/**
 * Lists all HubSpot custom-object schemas the token can see. Used
 * by the diag endpoint and by the consultations slug auto-detect.
 */
export async function listObjectSchemas(): Promise<
  HubSpotResult<
    Array<{
      name: string;
      objectTypeId: string;
      labels?: { singular?: string; plural?: string };
    }>
  >
> {
  const res = await hsFetch<{
    results: Array<{
      name: string;
      objectTypeId: string;
      labels?: { singular?: string; plural?: string };
    }>;
  }>(`/crm/v3/schemas`, { method: "GET" });
  if (!res.ok) return res;
  return { ok: true, data: res.data.results ?? [] };
}

/**
 * Resolve the HubSpot object slug we should pull consultations from.
 *
 *  1. If `HUBSPOT_CONSULTATIONS_OBJECT_TYPE` is set, use it verbatim.
 *  2. Try HubSpot's standard `appointments` object — JoodLife stores
 *     consultation bookings there (we observed 473 records in the
 *     CRM under CRM > Appointments). This is the most common path.
 *  3. List all custom-object schemas and pick the first one whose
 *     name/labels look like "appointment*" or "consult*".
 *  4. Fall back to the literal string "consultations" (which will
 *     fail the lookup and trigger the Notes-based fallback in
 *     listConsultationRecords).
 *
 * The result is cached for the lifetime of the request module.
 */
let _cachedConsultationsObjectType: string | null = null;

async function objectTypeExists(slug: string): Promise<boolean> {
  // A 0-result search is `ok`. A 400/404 with "Unable to infer
  // object type" tells us the slug isn't installed for this account.
  const res = await hsFetch<{ total?: number }>(
    `/crm/v3/objects/${encodeURIComponent(slug)}/search`,
    {
      method: "POST",
      body: JSON.stringify({ filterGroups: [], limit: 1 }),
    }
  );
  return res.ok;
}

export async function resolveConsultationsObjectType(): Promise<string> {
  if (process.env.HUBSPOT_CONSULTATIONS_OBJECT_TYPE) {
    return process.env.HUBSPOT_CONSULTATIONS_OBJECT_TYPE;
  }
  if (_cachedConsultationsObjectType) return _cachedConsultationsObjectType;

  // Try the most common slug first — HubSpot's built-in
  // `appointments` object — without listing schemas. Cheaper and
  // matches the observed JoodLife CRM layout.
  if (await objectTypeExists("appointments")) {
    _cachedConsultationsObjectType = "appointments";
    return _cachedConsultationsObjectType;
  }

  const schemas = await listObjectSchemas();
  if (schemas.ok) {
    const match = schemas.data.find((s) => {
      const blob = [
        s.name,
        s.labels?.singular,
        s.labels?.plural,
        s.objectTypeId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return /appointment|consult|booking|quiz/.test(blob);
    });
    if (match) {
      _cachedConsultationsObjectType = match.objectTypeId || match.name;
      return _cachedConsultationsObjectType;
    }
  }

  _cachedConsultationsObjectType = "consultations";
  return _cachedConsultationsObjectType;
}

/**
 * Total record count for a HubSpot object type (used by the diag
 * endpoint). Returns 0 if the type isn't accessible or the search
 * endpoint fails.
 */
export async function countObjectRecords(
  objectType: string
): Promise<HubSpotResult<number>> {
  const res = await hsFetch<{ total?: number }>(
    `/crm/v3/objects/${encodeURIComponent(objectType)}/search`,
    {
      method: "POST",
      body: JSON.stringify({ filterGroups: [], limit: 1 }),
    }
  );
  if (!res.ok) return res;
  return { ok: true, data: Number(res.data.total ?? 0) || 0 };
}

/**
 * Property names we read off the consultations source object —
 * a generous superset covering both:
 *
 *   - HubSpot's standard `appointments` object: hs_appointment_*,
 *     hs_object_id, hs_appointment_name, hs_duration, etc.
 *   - Custom consultation/quiz objects: email, full_name, dose,
 *     product_slug, answers, status, ...
 *
 * HubSpot ignores unknown property names, so listing both flavours
 * is cheap. Customise via env if your HubSpot uses different ones.
 */
const CONSULTATION_PROPERTIES = [
  // Custom-object / quiz-style
  "email",
  "full_name",
  "fullname",
  "phone",
  "date_of_birth",
  "dob",
  "product_slug",
  "dose",
  "answers",
  "consultation_status",
  "status",
  // Standard HubSpot Appointments object
  "hs_appointment_name",
  "hs_appointment_start",
  "hs_appointment_end",
  "hs_duration",
  "hs_meeting_outcome",
  "hs_appointment_status",
  "hubspot_owner_id",
  "name",
  "title",
  "notes",
  // Common timestamps (used as the consultation's created_at fallback)
  "createdate",
  "hs_createdate",
  "hs_lastmodifieddate",
] as const;

export type HubSpotConsultationRecord = {
  id: string;
  properties: Record<string, string | undefined>;
  contactEmail?: string | null;
  contactId?: string | null;
};

/* ------------------------------------------------------------------ */
/* HubSpot Marketing Forms — `JOOD Consultation Form` lives here       */
/* ------------------------------------------------------------------ */

export type HubSpotFormSummary = {
  id: string;
  name: string;
  archived?: boolean;
};

/**
 * List Marketing Forms via /marketing/v3/forms. Used to auto-detect
 * the consultation form when `HUBSPOT_CONSULTATION_FORM_ID` isn't
 * set explicitly. Filters out archived forms.
 */
export async function listMarketingForms(): Promise<
  HubSpotResult<HubSpotFormSummary[]>
> {
  const res = await hsFetch<{ results: HubSpotFormSummary[] }>(
    `/marketing/v3/forms?limit=200`,
    { method: "GET" }
  );
  if (!res.ok) return res;
  return {
    ok: true,
    data: (res.data.results ?? []).filter((f) => !f.archived),
  };
}

/**
 * Resolve which Marketing Form id(s) to pull consultation
 * submissions from. Order:
 *   1. HUBSPOT_CONSULTATION_FORM_ID (single id, comma-separated for many)
 *   2. Auto-detect: every non-archived form with `consultation` in
 *      its name.
 * Cached for the lifetime of the module.
 */
let _cachedConsultationFormIds: string[] | null = null;
export async function resolveConsultationFormIds(): Promise<string[]> {
  if (process.env.HUBSPOT_CONSULTATION_FORM_ID) {
    return process.env.HUBSPOT_CONSULTATION_FORM_ID.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (_cachedConsultationFormIds) return _cachedConsultationFormIds;
  const forms = await listMarketingForms();
  if (!forms.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hubspot:resolveConsultationFormIds] listMarketingForms failed (${forms.status}): ${forms.error}` +
        (forms.status === 403
          ? " — your HubSpot Private App needs the `forms` scope."
          : "")
    );
    _cachedConsultationFormIds = [];
    return [];
  }
  const matches = forms.data
    .filter((f) =>
      /(consult|jood|quiz|booking|questionnaire)/i.test(f.name ?? "")
    )
    .map((f) => f.id);
  if (matches.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hubspot:resolveConsultationFormIds] no form name matched the consult/jood/quiz/booking/questionnaire heuristic. ` +
        `Available forms: ${forms.data.map((f) => `${f.name} (${f.id})`).join(", ")}`
    );
  }
  _cachedConsultationFormIds = matches;
  return matches;
}

type RawSubmission = {
  submittedAt?: number;
  conversionId?: string;
  pageUrl?: string;
  values?: Array<{
    name: string;
    value: string;
    objectTypeId?: string;
  }>;
};

/**
 * HubSpot's legacy form-integrations endpoint hard-caps `limit` at
 * 50 per page (it returns HTTP 400 "Limit on query too large.
 * Maximum is 50" for anything higher). Anything passed through
 * fetchFormSubmissionsPage above this is silently clamped down.
 */
const FORM_SUBMISSIONS_PAGE_LIMIT = 50;

/**
 * Fetch one page of submissions for a given Marketing Form. The
 * legacy form-integrations endpoint stays the most reliable surface
 * for this — newer GraphQL flavours need extra scopes some accounts
 * don't have.
 */
async function fetchFormSubmissionsPage(
  formId: string,
  after?: string,
  limit = FORM_SUBMISSIONS_PAGE_LIMIT
): Promise<HubSpotResult<{ results: RawSubmission[]; nextAfter: string | null }>> {
  const safeLimit = Math.min(Math.max(limit, 1), FORM_SUBMISSIONS_PAGE_LIMIT);
  const params = new URLSearchParams({ limit: String(safeLimit) });
  if (after) params.set("after", after);
  const res = await hsFetch<{
    results?: RawSubmission[];
    paging?: { next?: { after?: string } };
  }>(
    `/form-integrations/v1/submissions/forms/${encodeURIComponent(formId)}?${params.toString()}`,
    { method: "GET" }
  );
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      results: res.data.results ?? [],
      nextAfter: res.data.paging?.next?.after ?? null,
    },
  };
}

/** Find a value in a submission's flat values array, case-insensitive. */
function pickValue(
  values: NonNullable<RawSubmission["values"]>,
  ...names: string[]
): string {
  for (const n of names) {
    const hit = values.find(
      (v) => (v.name ?? "").toLowerCase() === n.toLowerCase()
    );
    if (hit?.value) return hit.value;
  }
  return "";
}

/**
 * Treat HubSpot Marketing Form submissions as consultation records.
 * Each submission becomes one HubSpotConsultationRecord, with the
 * synthetic id `form:{formId}:{submittedAtEpoch}:{email-hash}` so
 * idempotent re-runs match correctly via hubspot_object_id.
 *
 * Returns the same shape as listConsultationRecords so the upstream
 * runner stays source-agnostic.
 *
 * Cursor encoding:  `formId:after` for the active form, switching to
 * the next form when we've drained the current one. So a single
 * monotonic `after` cursor walks every consultation form.
 */
export async function listConsultationFormSubmissionsAsRecords(
  after?: string,
  limit = 100
): Promise<
  HubSpotResult<{
    results: HubSpotConsultationRecord[];
    nextAfter: string | null;
    objectType: string;
  }>
> {
  const formIds = await resolveConsultationFormIds();
  if (formIds.length === 0) {
    return {
      ok: false,
      status: 404,
      error:
        "No HubSpot Marketing Form id found. Set HUBSPOT_CONSULTATION_FORM_ID or rename a form so it contains 'Consultation'.",
    };
  }

  // Decode the incoming cursor: "formIdx:innerCursor" — formIdx is
  // an index into formIds so we can advance to the next form when
  // the current one's pagination is exhausted.
  let formIdx = 0;
  let innerAfter: string | undefined;
  if (after) {
    const idx = after.indexOf(":");
    if (idx > 0) {
      formIdx = Number(after.slice(0, idx)) || 0;
      const tail = after.slice(idx + 1);
      innerAfter = tail || undefined;
    }
  }
  if (formIdx < 0 || formIdx >= formIds.length) {
    return { ok: true, data: { results: [], nextAfter: null, objectType: "forms" } };
  }

  const currentFormId = formIds[formIdx];
  const page = await fetchFormSubmissionsPage(currentFormId, innerAfter, limit);
  if (!page.ok) return page;

  const enriched: HubSpotConsultationRecord[] = page.data.results.map((s) => {
    const values = s.values ?? [];
    const email = pickValue(values, "email", "contact_email");
    const firstName = pickValue(values, "firstname", "first_name");
    const lastName = pickValue(values, "lastname", "last_name");
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const phone = pickValue(values, "phone", "mobilephone", "phone_number");
    const dateOfBirth = pickValue(
      values,
      "date_of_birth",
      "dob",
      "birthdate"
    );
    const productSlug = pickValue(
      values,
      "product_slug",
      "product",
      "selected_product",
      "treatment"
    );
    const dose = pickValue(values, "dose", "dosage", "selected_dose");

    // Everything that isn't a header field becomes part of `answers`
    const skip = new Set([
      "email",
      "contact_email",
      "firstname",
      "first_name",
      "lastname",
      "last_name",
      "phone",
      "mobilephone",
      "phone_number",
      "date_of_birth",
      "dob",
      "birthdate",
      "product_slug",
      "product",
      "selected_product",
      "treatment",
      "dose",
      "dosage",
      "selected_dose",
    ]);
    const answers: Record<string, string> = {};
    for (const v of values) {
      const key = (v.name ?? "").trim();
      if (!key || skip.has(key.toLowerCase())) continue;
      answers[key] = v.value ?? "";
    }
    if (s.pageUrl) answers["__pageUrl"] = s.pageUrl;
    if (s.submittedAt) answers["__submittedAt"] = String(s.submittedAt);

    const stableId = `form:${currentFormId}:${s.submittedAt ?? 0}:${email || s.conversionId || ""}`;

    return {
      id: stableId,
      properties: {
        email,
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        product_slug: productSlug,
        dose,
        answers: JSON.stringify(answers),
        status: "submitted",
        hs_createdate: s.submittedAt ? String(s.submittedAt) : "",
      },
      contactId: null,
      contactEmail: email || null,
    };
  });

  // Build the nextAfter cursor. If this form has more pages, stay on
  // it; otherwise advance to the next form (with no inner cursor).
  let nextAfter: string | null = null;
  if (page.data.nextAfter) {
    nextAfter = `${formIdx}:${page.data.nextAfter}`;
  } else if (formIdx + 1 < formIds.length) {
    nextAfter = `${formIdx + 1}:`;
  }

  return {
    ok: true,
    data: { results: enriched, nextAfter, objectType: "forms" },
  };
}

/**
 * Parse a JoodLife consultation note body (HTML) into the same
 * properties shape we get from a custom-object record. The
 * checkout flow writes this exact format via
 * /api/consultations -> addNoteToContact, so the marker
 * "JoodLife consultation submitted" is reliable.
 *
 * Format:
 *   <p><b>JoodLife consultation submitted</b><br/>
 *   Reference: #12 · Product: mounjaro · Dose: 5mg</p>
 *   <hr/><p><b>question1</b>: answer1<br/><b>question2</b>: a2</p>
 */
export function parseConsultationNoteBody(html: string): {
  reference: string | null;
  productSlug: string | null;
  dose: string | null;
  answers: Record<string, string>;
} {
  const refMatch = html.match(
    /Reference:\s*#?(\d+)\s*·\s*Product:\s*([^·<]+?)\s*·\s*Dose:\s*([^<]+?)\s*(?:<|$)/i
  );
  const reference = refMatch ? refMatch[1].trim() : null;
  const productSlug = refMatch ? refMatch[2].trim() : null;
  const dose = refMatch ? refMatch[3].trim() : null;

  const answers: Record<string, string> = {};
  // <b>key</b>: value, terminated by <br/>, </p>, or end of string
  const re = /<b>([^<]+?)<\/b>\s*:\s*([\s\S]*?)(?=<br\s*\/?>|<\/p>|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const key = m[1].trim();
    if (!key || key === "JoodLife consultation submitted") continue;
    const value = m[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    answers[key] = value;
  }
  return { reference, productSlug, dose, answers };
}

const CONSULTATION_NOTE_MARKER = "JoodLife consultation submitted";

/**
 * Paginated list of HubSpot Notes that look like JoodLife
 * consultation submissions. Each note's HTML body is parsed back
 * into the same `properties` shape a custom-object record would
 * carry, so the upsert runner can stay agnostic of the source.
 *
 * The associated contact is resolved via the v4 associations
 * endpoint (notes don't return associations in the search payload),
 * then contact emails are batched in one /batch/read call.
 */
async function listConsultationNotesAsRecords(
  after?: string,
  limit = 100
): Promise<
  HubSpotResult<{
    results: HubSpotConsultationRecord[];
    nextAfter: string | null;
    objectType: string;
  }>
> {
  const search = await hsFetch<{
    results: Array<{
      id: string;
      properties: { hs_note_body?: string; hs_timestamp?: string };
    }>;
    paging?: { next?: { after: string } };
  }>(`/crm/v3/objects/notes/search`, {
    method: "POST",
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
      properties: ["hs_note_body", "hs_timestamp"],
      sorts: [
        { propertyName: "hs_timestamp", direction: "DESCENDING" },
      ],
      limit,
      after: after ?? "0",
    }),
  });
  if (!search.ok) return search;

  // Filter to notes that actually carry the consultation marker
  // (CONTAINS_TOKEN matches loosely on whole tokens, so non-
  // consultation notes mentioning "JoodLife" can leak through).
  const matched = search.data.results.filter((n) =>
    (n.properties.hs_note_body ?? "").includes(CONSULTATION_NOTE_MARKER)
  );

  // Resolve associated contacts for each note via v4 associations.
  const noteToContact = new Map<string, string>();
  for (const n of matched) {
    const assocRes = await hsFetch<{
      results?: Array<{ toObjectId: string; id?: string }>;
    }>(`/crm/v4/objects/notes/${n.id}/associations/contacts`, {
      method: "GET",
    });
    if (assocRes.ok) {
      const cid =
        assocRes.data.results?.[0]?.toObjectId ??
        assocRes.data.results?.[0]?.id ??
        null;
      if (cid) noteToContact.set(n.id, cid);
    }
  }

  const contactIds = Array.from(new Set(noteToContact.values()));
  const contactById = new Map<
    string,
    { email?: string; firstname?: string; lastname?: string; phone?: string }
  >();
  if (contactIds.length > 0) {
    const batch = await hsFetch<{
      results: Array<{ id: string; properties: Record<string, string> }>;
    }>(`/crm/v3/objects/contacts/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        properties: ["email", "firstname", "lastname", "phone"],
        inputs: contactIds.map((id) => ({ id })),
      }),
    });
    if (batch.ok) {
      for (const c of batch.data.results) {
        contactById.set(c.id, {
          email: c.properties.email,
          firstname: c.properties.firstname,
          lastname: c.properties.lastname,
          phone: c.properties.phone,
        });
      }
    }
  }

  const enriched: HubSpotConsultationRecord[] = matched.map((n) => {
    const body = n.properties.hs_note_body ?? "";
    const parsed = parseConsultationNoteBody(body);
    const contactId = noteToContact.get(n.id) ?? null;
    const contact = contactId ? contactById.get(contactId) : undefined;
    const fullName =
      contact?.firstname || contact?.lastname
        ? [contact?.firstname, contact?.lastname].filter(Boolean).join(" ").trim()
        : "";
    return {
      id: n.id, // HubSpot note id — stable upsert key
      properties: {
        email: contact?.email ?? "",
        full_name: fullName,
        phone: contact?.phone ?? "",
        product_slug: parsed.productSlug ?? "",
        dose: parsed.dose ?? "",
        answers: JSON.stringify(parsed.answers),
        status: "submitted",
        // Pass through the timestamp so the runner gets a real created_at
        hs_createdate: n.properties.hs_timestamp ?? "",
      },
      contactId,
      contactEmail: contact?.email ?? null,
    };
  });

  return {
    ok: true,
    data: {
      results: enriched,
      nextAfter: search.data.paging?.next?.after ?? null,
      objectType: "notes",
    },
  };
}

/**
 * Paginated list of consultation custom-object records, plus the
 * email of the first associated contact (used to link the
 * consultation back to a user in our DB).
 *
 * Auto-falls-back to the Notes-based source when the operator's
 * HubSpot doesn't have a custom object configured (the common case
 * — checkout writes consultations as Notes attached to contacts).
 * The fallback returns the same shape so callers don't branch.
 */
export async function listConsultationRecords(
  after?: string,
  limit = 100
): Promise<
  HubSpotResult<{
    results: HubSpotConsultationRecord[];
    nextAfter: string | null;
    objectType: string;
  }>
> {
  // Explicit overrides win.
  if (process.env.HUBSPOT_CONSULTATIONS_SOURCE === "forms") {
    return listConsultationFormSubmissionsAsRecords(after, limit);
  }
  if (process.env.HUBSPOT_CONSULTATIONS_SOURCE === "notes") {
    return listConsultationNotesAsRecords(after, limit);
  }

  // Default order: Marketing Forms (where JOOD Consultation Form
  // lives) -> standard Appointments object -> Notes fallback.
  // Try forms first because the operator confirmed that's the
  // surface holding the live submission data. If no consultation
  // form is found in the account we fall through to the
  // custom-object / appointments path.
  const formIds = await resolveConsultationFormIds();
  if (formIds.length > 0) {
    return listConsultationFormSubmissionsAsRecords(after, limit);
  }

  const objectType = await resolveConsultationsObjectType();
  const params = new URLSearchParams({
    limit: String(limit),
    properties: CONSULTATION_PROPERTIES.join(","),
    associations: "contacts",
  });
  if (after) params.set("after", after);

  type RawRecord = {
    id: string;
    properties: Record<string, string | undefined>;
    associations?: {
      contacts?: { results?: Array<{ id: string }> };
    };
  };

  const res = await hsFetch<{
    results: RawRecord[];
    paging?: { next?: { after: string } };
  }>(`/crm/v3/objects/${encodeURIComponent(objectType)}?${params.toString()}`, {
    method: "GET",
  });

  // Auto-fallback: if HubSpot reports the object type doesn't exist
  // (the common case — checkout writes consultations as Notes, not
  // a custom object), retry against the Notes source so the sync
  // still produces rows.
  if (
    !res.ok &&
    (/unable to infer object type/i.test(res.error) ||
      /unknown object type/i.test(res.error) ||
      res.status === 404)
  ) {
    // eslint-disable-next-line no-console
    console.info(
      `[hubspot:consultations] custom-object "${objectType}" not found — falling back to Notes`
    );
    return listConsultationNotesAsRecords(after, limit);
  }
  if (!res.ok) return res;

  // Batch-resolve contact emails (single round-trip for the whole page).
  const contactIds: string[] = [];
  for (const r of res.data.results) {
    const cid = r.associations?.contacts?.results?.[0]?.id;
    if (cid && !contactIds.includes(cid)) contactIds.push(cid);
  }

  const emailById = new Map<string, string>();
  if (contactIds.length > 0) {
    const batch = await hsFetch<{
      results: Array<{ id: string; properties: Record<string, string> }>;
    }>(`/crm/v3/objects/contacts/batch/read`, {
      method: "POST",
      body: JSON.stringify({
        properties: ["email", "firstname", "lastname", "phone"],
        inputs: contactIds.map((id) => ({ id })),
      }),
    });
    if (batch.ok) {
      for (const c of batch.data.results) {
        if (c.properties?.email) emailById.set(c.id, c.properties.email);
      }
    }
  }

  const enriched: HubSpotConsultationRecord[] = res.data.results.map((r) => {
    const contactId = r.associations?.contacts?.results?.[0]?.id ?? null;
    return {
      id: r.id,
      properties: r.properties,
      contactId,
      contactEmail: contactId ? (emailById.get(contactId) ?? null) : null,
    };
  });

  return {
    ok: true,
    data: {
      results: enriched,
      nextAfter: res.data.paging?.next?.after ?? null,
      objectType,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Background-safe wrappers — fire and forget                          */
/* ------------------------------------------------------------------ */

/**
 * Wraps a HubSpot call so the storefront request returns immediately
 * regardless of HubSpot's latency. Errors are logged but never
 * propagated. Use this from request handlers where the user is
 * waiting for a response.
 */
export function fireHubSpot<T>(
  label: string,
  fn: () => Promise<HubSpotResult<T>>
): Promise<HubSpotResult<T>> {
  if (!isHubSpotEnabled()) {
    // Returns a resolved no-op so callers don't have to branch
    return Promise.resolve({
      ok: false,
      status: 0,
      error: "HubSpot not configured",
    });
  }
  return (async () => {
    try {
      const res = await fn();
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          `[hubspot:${label}] failed (${res.status}): ${res.error}`
        );
      }
      return res;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[hubspot:${label}] threw:`, err);
      return {
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : String(err),
      } as HubSpotResult<T>;
    }
  })();
}
