/**
 * GET /api/hubspot/weightlog-test   (admin only)
 *
 * Diagnoses why a weight-log entry might not be reaching HubSpot. Weight
 * logs sync as a Note on the customer's contact (addNoteToContact), which
 * needs the `crm.objects.notes.write` scope in addition to the contacts
 * scopes. This endpoint reports:
 *   - whether the token is set
 *   - the token's granted scopes
 *   - whether the required notes scope is present
 *   - (with ?write=1) the result of an actual test note write to the
 *     signed-in admin's own contact, surfacing the exact HubSpot error
 *
 * Read-only by default; pass ?write=1 to create one diagnostic note.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import {
  isHubSpotEnabled,
  getHubSpotTokenInfo,
  addNoteToContact,
} from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REQUIRED_NOTES_SCOPE = "crm.objects.notes.write";

export async function GET(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  if (!isHubSpotEnabled()) {
    return NextResponse.json({
      ok: false,
      hasToken: false,
      hint: "HUBSPOT_ACCESS_TOKEN is not set in Vercel env vars.",
    });
  }

  const info = await getHubSpotTokenInfo();
  const scopes = info.ok ? info.data.scopes : [];
  const hasNotesScope = scopes.includes(REQUIRED_NOTES_SCOPE);
  const hasContactsWrite = scopes.includes("crm.objects.contacts.write");

  // Optional live note write to the admin's own contact.
  const doWrite = req.nextUrl.searchParams.get("write") === "1";
  let noteWrite:
    | { attempted: false }
    | { attempted: true; ok: boolean; status?: number; error?: string; noteId?: string } = {
    attempted: false,
  };
  if (doWrite) {
    const email = (user as unknown as { email?: string }).email ?? "";
    const res = await addNoteToContact(
      email,
      `[JoodLife diagnostic] weight-log note write test`
    );
    noteWrite = res.ok
      ? { attempted: true, ok: true, noteId: res.data.id }
      : { attempted: true, ok: false, status: res.status, error: res.error };
  }

  const verdict = !info.ok
    ? `Could not read token info (${info.status}): ${info.error}`
    : hasNotesScope
      ? "Notes scope present — weight-log sync should work. If notes still don't appear, run again with ?write=1 to see the live write result."
      : `MISSING the '${REQUIRED_NOTES_SCOPE}' scope. Add it to your HubSpot Private App, regenerate the token, update HUBSPOT_ACCESS_TOKEN in Vercel, and redeploy.`;

  return NextResponse.json({
    ok: info.ok && hasNotesScope,
    hasToken: true,
    hubId: info.ok ? info.data.hubId : undefined,
    scopes,
    hasContactsWrite,
    hasNotesScope,
    requiredNotesScope: REQUIRED_NOTES_SCOPE,
    noteWrite,
    verdict,
  });
}
