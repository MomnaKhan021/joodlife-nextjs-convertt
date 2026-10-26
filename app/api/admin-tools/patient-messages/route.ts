/**
 * /api/admin-tools/patient-messages — the clinical team's side of the patient
 * portal's Messages screen and weekly check-ins. Clinical Check permission.
 *
 *   GET                 → { threads: [...] } newest first, with unread counts
 *   GET ?userId=        → { patient, messages, checkins } and marks the
 *                          patient's messages as read by staff
 *   POST { userId, svc, body }        → staff reply in that service's thread
 *   POST { checkinId, reply }         → reply to a check-in (also posted to
 *                                        the patient's weight loss thread)
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { canUseSection } from "@/lib/adminToolsAuth";
import { asObject, ensurePortalTables, getDb, lit } from "@/lib/portal/db";
import { isSameOrigin } from "@/lib/portal/api";
import { sendPortalMessageNoticeEmail } from "@/lib/account-email";

/** Tell the patient there is a reply waiting (no content in the email). */
async function notifyPatient(email: string, name: string | null) {
  try {
    const payload = await getPayloadInstance();
    await sendPortalMessageNoticeEmail(payload, { email, name });
  } catch (err) {
    console.error("[patient-messages] notice email failed:", (err as Error).message);
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function staff() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!canUseSection(user, "clinical")) return null;
  const u = user as unknown as { id: number; name?: string; email?: string };
  return { id: u.id, name: (u.name || u.email || "Jood clinical team").trim() };
}

const deny = () => NextResponse.json({ ok: false, error: "You don't have access to patient messages" }, { status: 403 });

export async function GET(req: NextRequest) {
  const who = await staff();
  if (!who) return deny();
  const db = await getDb();
  await ensurePortalTables(db);
  // Sidebar badge: patients waiting on the clinical team (an unread message or
  // a check-in nobody has replied to).
  if (req.nextUrl.searchParams.get("count")) {
    const rows = await db.query(`
      SELECT count(DISTINCT user_id)::int AS n FROM (
        SELECT user_id FROM portal_messages WHERE from_staff = false AND read_by_staff_at IS NULL
        UNION ALL SELECT user_id FROM portal_checkins WHERE reply IS NULL
      ) x
    `);
    return NextResponse.json({ ok: true, count: Number(rows[0]?.n ?? 0) });
  }

  const userId = Number(req.nextUrl.searchParams.get("userId"));

  if (!Number.isFinite(userId) || !userId) {
    const threads = await db.query(`
      WITH people AS (
        SELECT user_id, max(created_at) AS last_at FROM (
          SELECT user_id, created_at FROM portal_messages
          UNION ALL SELECT user_id, created_at FROM portal_checkins
        ) x GROUP BY user_id
      )
      SELECT p.user_id, p.last_at,
        COALESCE(u.name, '') AS name, COALESCE(u.email, '') AS email,
        (SELECT count(*)::int FROM portal_messages m WHERE m.user_id = p.user_id AND m.from_staff = false AND m.read_by_staff_at IS NULL) AS unread,
        (SELECT count(*)::int FROM portal_checkins c WHERE c.user_id = p.user_id AND c.reply IS NULL) AS open_checkins,
        (SELECT bool_or(c.severe) FROM portal_checkins c WHERE c.user_id = p.user_id AND c.reply IS NULL) AS severe,
        (SELECT body FROM portal_messages m WHERE m.user_id = p.user_id ORDER BY created_at DESC LIMIT 1) AS last_body
      FROM people p LEFT JOIN users u ON u.id = p.user_id
      ORDER BY (SELECT bool_or(c.severe) FROM portal_checkins c WHERE c.user_id = p.user_id AND c.reply IS NULL) DESC NULLS LAST,
        p.last_at DESC
      LIMIT 300
    `);
    return NextResponse.json({
      ok: true,
      threads: threads.map((t) => ({
        userId: Number(t.user_id),
        name: String(t.name || t.email || `Patient ${t.user_id}`),
        email: String(t.email ?? ""),
        lastAt: t.last_at,
        unread: Number(t.unread ?? 0),
        openCheckins: Number(t.open_checkins ?? 0),
        severe: Boolean(t.severe),
        lastBody: String(t.last_body ?? ""),
      })),
    });
  }

  const [u, messages, checkins, prefs] = await Promise.all([
    db.query(`SELECT id, name, email, phone, default_address FROM users WHERE id = ${lit(userId)} LIMIT 1`).catch(() => []),
    db.query(`SELECT * FROM portal_messages WHERE user_id = ${lit(userId)} ORDER BY created_at ASC LIMIT 1000`),
    db.query(`SELECT * FROM portal_checkins WHERE user_id = ${lit(userId)} ORDER BY created_at DESC LIMIT 100`),
    db.query(`SELECT data FROM portal_prefs WHERE user_id = ${lit(userId)} LIMIT 1`),
  ]);
  await db.query(`UPDATE portal_messages SET read_by_staff_at = now() WHERE user_id = ${lit(userId)} AND from_staff = false AND read_by_staff_at IS NULL`);
  const p = asObject(prefs[0]?.data);
  return NextResponse.json({
    ok: true,
    patient: {
      userId,
      name: String(u[0]?.name ?? ""),
      email: String(u[0]?.email ?? ""),
      phone: String(u[0]?.phone ?? ""),
      address: String(u[0]?.default_address ?? ""),
      safePlace: String(p.safePlace ?? ""),
      gpShare: Boolean(p.gpShare),
      gp: String(p.gp ?? ""),
    },
    messages: messages.map((m) => ({
      id: Number(m.id),
      svc: String(m.svc),
      fromStaff: Boolean(m.from_staff),
      author: String(m.author ?? ""),
      body: String(m.body ?? ""),
      at: m.created_at,
      readByPatient: Boolean(m.read_by_patient_at),
    })),
    checkins: checkins.map((c) => ({
      id: Number(c.id),
      at: c.created_at,
      mood: String(c.mood ?? ""),
      effects: Array.isArray(c.effects) ? c.effects : [],
      severe: Boolean(c.severe),
      note: String(c.note ?? ""),
      reply: c.reply ? String(c.reply) : "",
      repliedBy: String(c.replied_by ?? ""),
      repliedAt: c.replied_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ ok: false, error: "Cross-origin request rejected" }, { status: 403 });
  const who = await staff();
  if (!who) return deny();
  const db = await getDb();
  await ensurePortalTables(db);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (b.checkinId) {
    const reply = String(b.reply ?? "").trim().slice(0, 4000);
    if (!reply) return NextResponse.json({ ok: false, error: "Write a reply" }, { status: 400 });
    const rows = await db.query(`
      UPDATE portal_checkins SET reply = ${lit(reply)}, replied_by = ${lit(who.name)}, replied_at = now()
      WHERE id = ${lit(Number(b.checkinId))} RETURNING user_id, email
    `);
    if (!rows[0]) return NextResponse.json({ ok: false, error: "Check-in not found" }, { status: 404 });
    await db.query(`
      INSERT INTO portal_messages (user_id, email, svc, from_staff, author, body)
      VALUES (${lit(Number(rows[0].user_id))}, ${lit(String(rows[0].email))}, 'wl', true, ${lit(who.name)}, ${lit(`About your check-in: ${reply}`)})
    `);
    await notifyPatient(String(rows[0].email), null);
    return NextResponse.json({ ok: true });
  }

  const userId = Number(b.userId);
  const body = String(b.body ?? "").trim();
  const svc = ["wl", "ed", "pd"].includes(String(b.svc)) ? String(b.svc) : "wl";
  if (!Number.isFinite(userId) || !body) return NextResponse.json({ ok: false, error: "Write a reply" }, { status: 400 });
  if (body.length > 4000) return NextResponse.json({ ok: false, error: "Keep replies under 4,000 characters" }, { status: 400 });
  const u = await db.query(`SELECT email, name FROM users WHERE id = ${lit(userId)} LIMIT 1`);
  if (!u[0]) return NextResponse.json({ ok: false, error: "Patient not found" }, { status: 404 });
  await db.query(`
    INSERT INTO portal_messages (user_id, email, svc, from_staff, author, body)
    VALUES (${lit(userId)}, ${lit(String(u[0].email).toLowerCase())}, ${lit(svc)}, true, ${lit(who.name)}, ${lit(body)})
  `);
  await notifyPatient(String(u[0].email), (u[0].name as string) ?? null);
  return NextResponse.json({ ok: true });
}
