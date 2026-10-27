/**
 * /api/admin-tools/google/status
 *   GET    → { configured, connected, email } for the Clinical Check banner
 *   DELETE → admin only: disconnect (forget the stored Google access)
 */
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getGoogleConnection, googleConfigured, removeGoogleConnection } from "@/lib/googleMeetNotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin" && user?.role !== "staff") return NextResponse.json({ ok: false }, { status: 403 });
  const conn = googleConfigured() ? await getGoogleConnection().catch(() => null) : null;
  return NextResponse.json({
    ok: true,
    configured: googleConfigured(),
    connected: Boolean(conn),
    email: conn?.email ?? null,
    isAdmin: user.role === "admin",
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  await removeGoogleConnection();
  return NextResponse.json({ ok: true });
}
