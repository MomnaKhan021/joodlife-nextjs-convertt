import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE,
  TOKEN_MAX_AGE,
  hashCode,
  issueSessionForEmail,
  normalizeEmail,
  readState,
  signState,
} from "@/lib/authPasswordless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  let email = "";
  let code = "";
  try {
    const body = (await req.json()) as { email?: string; code?: string };
    email = normalizeEmail(body.email);
    code = String(body.code ?? "").replace(/\s/g, "");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const raw = req.cookies.get("jl_login_code")?.value;
  const state = readState<{ email: string; codeHash: string; exp: number; attempts: number }>(raw);
  if (!state) {
    return NextResponse.json({ ok: false, error: "Your code has expired — request a new one." }, { status: 400 });
  }
  if (Date.now() > state.exp) {
    return NextResponse.json({ ok: false, error: "Your code has expired — request a new one." }, { status: 400 });
  }
  if (state.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ ok: false, error: "Too many attempts — request a new code." }, { status: 429 });
  }
  const ok =
    email === state.email &&
    /^[0-9]{6}$/.test(code) &&
    hashCode(`${email}:${code}`) === state.codeHash;

  if (!ok) {
    // Re-issue the cookie with the attempt count bumped so guesses are capped.
    const res = NextResponse.json({ ok: false, error: "That code isn't right." }, { status: 400 });
    res.cookies.set(
      "jl_login_code",
      signState({ ...state, attempts: state.attempts + 1 }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Math.max(1, Math.floor((state.exp - Date.now()) / 1000)),
      },
    );
    return res;
  }

  const session = await issueSessionForEmail(email);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Couldn't sign you in. Try again." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, created: session.created });
  res.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
  res.cookies.set("jl_login_code", "", { path: "/", maxAge: 0 });
  return res;
}
