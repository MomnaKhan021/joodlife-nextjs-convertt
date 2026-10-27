import "server-only";

import crypto from "node:crypto";

import { getDb, lit, type Db } from "@/lib/portal/db";

/**
 * Gemini meeting notes for video consultations.
 *
 * The consultation calls are Google Meet events on the clinic's Google
 * Workspace calendar (hello@joodlife.com, booked through HubSpot). With
 * "Take notes with Gemini" on, Google saves a "Notes by Gemini" Doc and
 * attaches it to the calendar event. An admin connects that Google account
 * once (OAuth, read-only Calendar + Drive); after that, Clinical Check finds
 * each consultation's event by its Meet link and copies the notes onto the
 * consultation so they show next to Approve supply.
 *
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (a Google Cloud OAuth web
 * client on the joodlife.com Workspace, consent screen "Internal", Calendar
 * and Drive APIs enabled). The refresh token is stored encrypted in
 * app_integrations.
 */

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/admin-tools/google/callback`;
}

/* ---------------- token storage (encrypted) ---------------- */

function key(): Buffer {
  const secret = process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "jood-google-fallback";
  return crypto.createHash("sha256").update(`google-oauth:${secret}`).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

function decrypt(blob: string): string | null {
  try {
    const [iv, tag, enc] = blob.split(".").map((s) => Buffer.from(s, "base64"));
    const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

async function ensureTable(db: Db) {
  await db.query(`CREATE TABLE IF NOT EXISTS "app_integrations" (
    "key" varchar PRIMARY KEY,
    "data" text NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
  )`);
}

type Stored = { refreshToken: string; email: string; connectedBy: string; connectedAt: string };

export async function saveGoogleConnection(s: Stored): Promise<void> {
  const db = await getDb();
  await ensureTable(db);
  await db.query(`
    INSERT INTO "app_integrations" (key, data, updated_at) VALUES ('google', ${lit(encrypt(JSON.stringify(s)))}, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `);
}

export async function getGoogleConnection(): Promise<Stored | null> {
  const db = await getDb();
  await ensureTable(db);
  const row = (await db.query(`SELECT data FROM "app_integrations" WHERE key = 'google' LIMIT 1`))[0];
  if (!row) return null;
  const json = decrypt(String(row.data));
  if (!json) return null;
  try {
    return JSON.parse(json) as Stored;
  } catch {
    return null;
  }
}

export async function removeGoogleConnection(): Promise<void> {
  const db = await getDb();
  await ensureTable(db);
  await db.query(`DELETE FROM "app_integrations" WHERE key = 'google'`);
}

/* ---------------- OAuth ---------------- */

export function authUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(origin: string, code: string): Promise<{ refreshToken: string; accessToken: string; email: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  const j = (await res.json().catch(() => ({}))) as { refresh_token?: string; access_token?: string; id_token?: string; error_description?: string };
  if (!res.ok || !j.access_token) throw new Error(j.error_description || "Google sign-in failed");
  if (!j.refresh_token) throw new Error("Google didn't return offline access. Remove the app's access in your Google account and connect again.");
  let email = "";
  if (j.id_token) {
    try {
      email = String(JSON.parse(Buffer.from(j.id_token.split(".")[1], "base64url").toString("utf8")).email ?? "");
    } catch {
      /* ignore */
    }
  }
  return { refreshToken: j.refresh_token, accessToken: j.access_token, email };
}

let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  const conn = await getGoogleConnection();
  if (!conn) throw new NotConnected();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: conn.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !j.access_token) {
    if (j.error === "invalid_grant") throw new NotConnected("Google access was removed or expired. Connect Google again.");
    throw new Error("Couldn't reach Google. Try again in a minute.");
  }
  cached = { token: j.access_token, until: Date.now() + (j.expires_in ?? 3000) * 1000 };
  return cached.token;
}

export class NotConnected extends Error {
  constructor(msg = "Google isn't connected yet.") {
    super(msg);
  }
}

async function g<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken()}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Google API ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------- finding the notes ---------------- */

/** "abc-defg-hij" from any Meet URL. */
export function meetCode(url: unknown): string {
  const m = String(url ?? "").match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  return m ? m[1].toLowerCase() : "";
}

type CalEvent = {
  id: string;
  summary?: string;
  hangoutLink?: string;
  start?: { dateTime?: string };
  conferenceData?: { conferenceId?: string; entryPoints?: Array<{ uri?: string }> };
  attendees?: Array<{ email?: string }>;
  attachments?: Array<{ fileId?: string; fileUrl?: string; title?: string; mimeType?: string }>;
};

export type MeetingNotes = { text: string; docUrl: string; title: string };

const DOC = "application/vnd.google-apps.document";

/**
 * Find the Gemini notes for a consultation's call: the calendar event whose
 * Meet code matches (else one the patient attended near that time), then its
 * "Notes by Gemini" attachment, else a Drive Doc named after the event.
 * Returns null when the notes aren't there yet.
 */
export async function findGeminiNotes(opts: { meetUrl?: string | null; start?: string | null; patientEmail?: string | null }): Promise<MeetingNotes | null> {
  const start = opts.start ? new Date(opts.start) : null;
  if (!start || Number.isNaN(+start)) return null;
  const code = meetCode(opts.meetUrl);
  const from = new Date(+start - 3 * 3600e3).toISOString();
  const to = new Date(+start + 6 * 3600e3).toISOString();
  const list = await g<{ items?: CalEvent[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({
      timeMin: from,
      timeMax: to,
      singleEvents: "true",
      maxResults: "100",
    })}`,
  );
  const events = list.items ?? [];
  const email = String(opts.patientEmail ?? "").toLowerCase();
  const event =
    (code && events.find((e) => [e.hangoutLink, e.conferenceData?.conferenceId, ...(e.conferenceData?.entryPoints ?? []).map((p) => p.uri)].some((u) => meetCode(u) === code || String(u ?? "").toLowerCase() === code))) ||
    (email && events.find((e) => (e.attendees ?? []).some((a) => String(a.email ?? "").toLowerCase() === email))) ||
    null;
  if (!event) return null;

  const atts = (event.attachments ?? []).filter((a) => a.fileId && (a.mimeType === DOC || /docs\.google\.com\/document/.test(a.fileUrl ?? "")));
  let file = atts.find((a) => /gemini/i.test(a.title ?? "")) ?? atts.find((a) => /notes/i.test(a.title ?? "")) ?? null;

  if (!file && event.summary) {
    // Not attached yet: look for the Doc Gemini names "<event> … Notes by Gemini".
    const name = event.summary.replace(/'/g, "\\'").slice(0, 80);
    const found = await g<{ files?: Array<{ id: string; name: string; webViewLink?: string }> }>(
      `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
        q: `mimeType='${DOC}' and name contains '${name}' and name contains 'Gemini' and modifiedTime > '${from}' and trashed = false`,
        fields: "files(id,name,webViewLink)",
        pageSize: "5",
        orderBy: "modifiedTime desc",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      })}`,
    );
    const f = found.files?.[0];
    if (f) file = { fileId: f.id, title: f.name, fileUrl: f.webViewLink };
  }
  if (!file?.fileId) return null;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.fileId)}/export?mimeType=text/plain`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Couldn't read the notes Doc (Google ${res.status})`);
  const text = (await res.text()).replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return null;
  return {
    text: text.slice(0, 50_000),
    docUrl: file.fileUrl || `https://docs.google.com/document/d/${file.fileId}/edit`,
    title: file.title || "Notes by Gemini",
  };
}
