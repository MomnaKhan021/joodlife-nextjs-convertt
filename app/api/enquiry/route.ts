/**
 * POST /api/enquiry — public enquiry form (blog articles).
 *
 * Stores nothing locally: the enquiry goes straight to HubSpot as an
 * upserted contact plus a timeline note (matching how every other patient
 * touchpoint is tracked). Honeypot field + length caps keep bots/noise out.
 */
import { NextResponse, type NextRequest } from "next/server";

import { addNoteToContact, fireHubSpot, isHubSpotEnabled, upsertContact } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    message?: string;
    source?: string;
    website?: string; // honeypot — real users never fill this
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot filled → almost certainly a bot. Pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 4000);
  const source = String(body.source ?? "").trim().slice(0, 300);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: "Please write a message." }, { status: 400 });
  }

  if (!isHubSpotEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Enquiries are temporarily unavailable — please use the WhatsApp chat." },
      { status: 503 },
    );
  }

  const [first, ...rest] = name.split(" ");
  const note =
    `<p><b>📩 Blog enquiry</b>${source ? ` — from <a href="${source}">${source}</a>` : ""}</p>` +
    `<p>From: <b>${name || email}</b> (${email})</p>` +
    `<hr/><p>${message.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`;

  const contact = await fireHubSpot("enquiry:contact", () =>
    upsertContact({
      email,
      firstName: first || null,
      lastName: rest.join(" ") || null,
      phone: null,
      extra: { jood_consultation_status: "enquiry" },
    }),
  );
  await fireHubSpot("enquiry:note", () => addNoteToContact(email, note));

  if (contact && typeof contact === "object" && "ok" in contact && contact.ok === false) {
    return NextResponse.json(
      { ok: false, error: "Could not send right now — please try again or use WhatsApp." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
