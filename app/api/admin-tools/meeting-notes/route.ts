/**
 * POST /api/admin-tools/meeting-notes { consultationId, refresh? }
 *
 * Returns the Gemini notes for a consultation's video call, fetching them from
 * Google the first time (or on refresh) and saving them on the consultation
 * (answers._meeting_notes, _meeting_notes_doc, _meeting_notes_title,
 * _meeting_notes_at) so they show in Clinical Check and stay with the record.
 *
 *   → { ok, notes: { text, docUrl, title, fetchedAt } | null, status }
 *     status: "ready" | "not-ready" | "no-call" | "not-connected" | "error"
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canAccessSection } from "@/lib/adminSections";
import { asObject, getDb, jsonLit, lit } from "@/lib/portal/db";
import { findGeminiNotes, googleConfigured, NotConnected } from "@/lib/googleMeetNotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canAccessSection(user.role, user.permissions, "clinical")) {
    return NextResponse.json({ ok: false, error: "You don't have access to Clinical Check" }, { status: 403 });
  }
  // start / meetUrl: what the card already knows from HubSpot, used when the
  // consultation hasn't cached them yet.
  const b = (await req.json().catch(() => ({}))) as { consultationId?: unknown; refresh?: unknown; start?: unknown; meetUrl?: unknown };
  const id = Number(b.consultationId);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ ok: false, error: "Invalid consultationId" }, { status: 400 });

  const db = await getDb();
  const row = (await db.query(`SELECT email, answers FROM "consultations" WHERE id = ${lit(id)} LIMIT 1`))[0];
  if (!row) return NextResponse.json({ ok: false, error: "Consultation not found" }, { status: 404 });
  const a = asObject(row.answers);

  const saved = typeof a._meeting_notes === "string" && a._meeting_notes.trim()
    ? { text: a._meeting_notes as string, docUrl: String(a._meeting_notes_doc ?? ""), title: String(a._meeting_notes_title ?? "Notes by Gemini"), fetchedAt: String(a._meeting_notes_at ?? "") }
    : null;
  if (saved && b.refresh !== true) return NextResponse.json({ ok: true, notes: saved, status: "ready" });

  const start = typeof a._meeting_start === "string" ? a._meeting_start : typeof b.start === "string" ? b.start : null;
  if (!start) return NextResponse.json({ ok: true, notes: saved, status: "no-call" });
  if (!googleConfigured()) return NextResponse.json({ ok: true, notes: saved, status: "not-connected" });

  try {
    const notes = await findGeminiNotes({
      meetUrl: typeof a._meeting_join === "string" ? a._meeting_join : typeof b.meetUrl === "string" ? b.meetUrl : null,
      start,
      patientEmail: String(row.email ?? ""),
    });
    if (!notes) return NextResponse.json({ ok: true, notes: saved, status: "not-ready" });
    const fetchedAt = new Date().toISOString();
    await db.query(`
      UPDATE "consultations"
      SET answers = COALESCE(answers, '{}'::jsonb) || ${jsonLit({
        _meeting_notes: notes.text,
        _meeting_notes_doc: notes.docUrl,
        _meeting_notes_title: notes.title,
        _meeting_notes_at: fetchedAt,
      })},
          updated_at = now()
      WHERE id = ${lit(id)}
    `);
    return NextResponse.json({ ok: true, notes: { ...notes, fetchedAt }, status: "ready" });
  } catch (err) {
    if (err instanceof NotConnected) return NextResponse.json({ ok: true, notes: saved, status: "not-connected", error: err.message });
    console.error("[meeting-notes]", (err as Error).message);
    return NextResponse.json({ ok: true, notes: saved, status: "error", error: (err as Error).message });
  }
}
