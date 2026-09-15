import { NextResponse } from "next/server";

import { getIsReturningPatient } from "@/lib/returningPatient";

// User-specific (reads the auth cookie), so never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const returning = await getIsReturningPatient();
  const res = NextResponse.json({ returning });
  // Non-httpOnly on purpose: the client CTA reads it for a flash-free initial
  // render. It only says "has this person ordered" — no sensitive data.
  res.cookies.set("jl_returning", returning ? "1" : "0", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}
