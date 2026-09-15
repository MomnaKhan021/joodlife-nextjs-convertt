/**
 * POST /api/profile/update — a signed-in customer edits their own account.
 *
 * Editable: name, phone, email (their login) and a default delivery address.
 * The address is stored on the account and used to prefill future checkouts;
 * it deliberately does NOT touch any order already placed.
 *
 * Auth: the current session only — a customer can edit their OWN record, never
 * anyone else's. Email changes are validated for format and uniqueness.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPayloadInstance } from "@/lib/payload";
import { isValidEmail, isValidFullName, NAME_MAX, ADDRESS_MAX } from "@/lib/formValidation";

/** Normalise a UK phone to national 0… form, or null. Mirrors the checkout. */
function normaliseUkPhone(raw: string): string | null {
  const digits = (raw || "").replace(/[\s().-]/g, "");
  let n = digits;
  if (n.startsWith("+44")) n = "0" + n.slice(3);
  else if (n.startsWith("0044")) n = "0" + n.slice(4);
  else if (n.startsWith("44") && n.length >= 12) n = "0" + n.slice(2);
  if (!/^0(?:1\d{8,9}|2\d{9}|3\d{9}|7\d{9})$/.test(n)) return null;
  return n;
}
const isUkPhone = (raw: string): boolean => normaliseUkPhone(raw) !== null;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}
const esc = (s: string) => "'" + String(s).replace(/'/g, "''") + "'";

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  }

  let body: { name?: string; email?: string; phone?: string; address?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, NAME_MAX);
  const emailRaw = String(body.email ?? "").trim().toLowerCase();
  const phoneRaw = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim().slice(0, ADDRESS_MAX);

  // Validate — each field only if the user supplied one (address may be blank).
  if (name && !isValidFullName(name)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid name." }, { status: 422 });
  }
  if (!emailRaw || !isValidEmail(emailRaw)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 422 });
  }
  let phone = "";
  if (phoneRaw) {
    if (!isUkPhone(phoneRaw)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid UK mobile number." }, { status: 422 });
    }
    phone = normaliseUkPhone(phoneRaw) ?? phoneRaw;
  }

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
  try {
    ({ drizzle, sql } = await getDrizzle());
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Server error.", detail: String(err) }, { status: 500 });
  }

  const numId = Number(user.id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  // Email uniqueness — a change must not collide with another account.
  if (emailRaw !== String(user.email ?? "").toLowerCase()) {
    try {
      const taken = rowsOf<{ id: number }>(
        await drizzle.execute(
          sql.raw(`SELECT id FROM "users" WHERE LOWER(email) = ${esc(emailRaw)} AND id <> ${numId} LIMIT 1`),
        ),
      );
      if (taken.length > 0) {
        return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
      }
    } catch {
      /* if the check fails, fall through — the UNIQUE index still protects us */
    }
  }

  try {
    // Store the default address in an idempotent column (no Payload migration).
    await drizzle.execute(sql.raw(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS default_address text`));
    await drizzle.execute(
      sql.raw(
        `UPDATE "users"
            SET name = ${name ? esc(name) : "name"},
                phone = ${phone ? esc(phone) : "NULL"},
                email = ${esc(emailRaw)},
                default_address = ${address ? esc(address) : "NULL"},
                updated_at = now()
          WHERE id = ${numId}`,
      ),
    );
  } catch (err) {
    const msg = String(err);
    // A race on the UNIQUE email index surfaces here.
    if (/unique|duplicate/i.test(msg)) {
      return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Could not save changes.", detail: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, name, email: emailRaw, phone, address });
}
