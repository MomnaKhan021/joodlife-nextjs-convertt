/**
 * Inventory REST surface (admin-only).
 *
 * GET    /api/admin-tools/inventory        → list all batches (newest first)
 * POST   /api/admin-tools/inventory        → create a batch
 *          Body: { medicineName, batchNumber, batchQuantity, expiryDate }
 * DELETE /api/admin-tools/inventory?id=N   → remove a batch
 *
 * Uses the Payload local API with overrideAccess after we've confirmed the
 * caller is an admin, so the collection's own access rules stay authoritative
 * for the native /admin UI while this route serves the custom dashboard.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  const isAdmin = Boolean(
    user && (user as { role?: string }).role === "admin",
  );
  return { payload, isAdmin };
}

export async function GET() {
  try {
    const { payload, isAdmin } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
    }
    const result = await payload.find({
      collection: "inventory",
      limit: 500,
      sort: "-createdAt",
      overrideAccess: true,
    });
    return NextResponse.json({ ok: true, items: result.docs });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "List failed", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: {
    medicineName?: string;
    batchNumber?: string;
    batchQuantity?: number | string;
    expiryDate?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const medicineName = String(body.medicineName ?? "").trim();
  const batchNumber = String(body.batchNumber ?? "").trim();
  const batchQuantity = Number(body.batchQuantity);
  const expiryDate = String(body.expiryDate ?? "").trim();

  if (!medicineName || !batchNumber || !expiryDate || !Number.isFinite(batchQuantity)) {
    return NextResponse.json(
      { ok: false, error: "medicineName, batchNumber, batchQuantity and expiryDate are required" },
      { status: 400 },
    );
  }

  try {
    const { payload, isAdmin } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
    }
    const created = await payload.create({
      collection: "inventory",
      data: {
        medicineName,
        batchNumber,
        batchQuantity,
        expiryDate: new Date(expiryDate).toISOString(),
      },
      overrideAccess: true,
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Create failed", detail: String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ ok: false, error: "Missing or bad ?id" }, { status: 400 });
  }
  try {
    const { payload, isAdmin } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
    }
    await payload.delete({ collection: "inventory", id, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Delete failed", detail: String(err) },
      { status: 500 },
    );
  }
}
