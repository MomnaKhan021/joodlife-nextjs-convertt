import { NextResponse, type NextRequest } from "next/server";

import { getPayloadInstance } from "@/lib/payload";
import { generateCode, hashCode, normalizeEmail, signState } from "@/lib/authPasswordless";
import { sendLoginCodeEmail } from "@/lib/account-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = normalizeEmail(body.email);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const code = generateCode();
  // Signed, httpOnly cookie holds only the hash + email + expiry + a small
  // attempt budget — never the code itself. The code goes out by email.
  const stateCookie = signState({
    email,
    codeHash: hashCode(`${email}:${code}`),
    exp: Date.now() + CODE_TTL_MS,
    attempts: 0,
  });

  try {
    const payload = await getPayloadInstance();
    await sendLoginCodeEmail(payload, { email, code });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Couldn't send the code. Try again." , detail: String(err) },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("jl_login_code", stateCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(CODE_TTL_MS / 1000),
  });
  return res;
}
