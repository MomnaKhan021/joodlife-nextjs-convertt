import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

// Reads the auth cookie, so never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const loggedIn = Boolean(user);
  const res = NextResponse.json({ loggedIn });
  // Non-httpOnly on purpose: the header reads it for a flash-free first paint.
  // It only says whether someone is signed in — no token, no personal data.
  res.cookies.set("jl_auth", loggedIn ? "1" : "0", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}
