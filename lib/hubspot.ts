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
 * Create or update a contact keyed by email. Returns the contact id.
 *
 *   - If a contact already exists, PATCH its properties.
 *   - Otherwise POST a new contact.
 */
export async function upsertContact(
  input: ContactInput
): Promise<HubSpotResult<{ id: string; created: boolean }>> {
  if (!input.email) return { ok: false, status: 400, error: "email required" };

  const properties: Record<string, string> = {};
  const setIf = (key: string, val: unknown) => {
    if (val === null || val === undefined) return;
    if (typeof val === "string" && !val.trim()) return;
    properties[key] = String(val);
  };
  setIf("email", input.email);
  setIf("firstname", input.firstName);
  setIf("lastname", input.lastName);
  setIf("phone", input.phone);
  if (input.extra) {
    for (const [k, v] of Object.entries(input.extra)) setIf(k, v);
  }

  const found = await searchContactByEmail(input.email);
  if (found.ok && found.data) {
    const updated = await hsFetch<HubSpotContact>(
      `/crm/v3/objects/contacts/${found.data.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      }
    );
    if (!updated.ok) return updated;
    return { ok: true, data: { id: updated.data.id, created: false } };
  }

  const created = await hsFetch<HubSpotContact>(`/crm/v3/objects/contacts`, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
  if (!created.ok) return created;
  return { ok: true, data: { id: created.data.id, created: true } };
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

const DEFAULT_PIPELINE = "default";
const DEFAULT_DEAL_STAGE = "appointmentscheduled";

export async function createDeal(
  input: DealInput
): Promise<HubSpotResult<{ id: string }>> {
  const properties: Record<string, string> = {
    dealname: input.name,
    amount: String(Math.round(input.amount * 100) / 100),
    pipeline: input.pipeline ?? DEFAULT_PIPELINE,
    dealstage: input.dealStage ?? DEFAULT_DEAL_STAGE,
  };
  if (input.closeDate) properties.closedate = input.closeDate;
  if (input.extra) {
    for (const [k, v] of Object.entries(input.extra)) {
      if (v === null || v === undefined) continue;
      properties[k] = String(v);
    }
  }

  const created = await hsFetch<HubSpotDeal>(`/crm/v3/objects/deals`, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
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
