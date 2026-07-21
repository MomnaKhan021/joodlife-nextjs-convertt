/**
 * Admin-only, one-off price fix for the Wegovy Pills product.
 *
 * Sets the active price to £109 and the strike-through (compare-at) price to
 * £149 — both at the product level (`fromPrice` / `comparePrice`, which drive
 * the "From £109" and struck-through £149 on the final product page) and on
 * every variant row (`price` / `comparePrice`).
 *
 * Visit this URL once while signed in as an admin. Idempotent — safe to run
 * again. You can override the numbers with ?price=…&compare=… if needed.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLUG = "wegovy-pills";

function numParam(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function handle(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  const price = numParam(req.nextUrl.searchParams.get("price"), 109);
  const compare = numParam(req.nextUrl.searchParams.get("compare"), 149);

  const found = await payload.find({
    collection: "products",
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = found.docs[0] as
    | { id: string | number; variants?: Array<Record<string, unknown>> }
    | undefined;
  if (!doc) {
    return NextResponse.json(
      { ok: false, error: `No product found with slug "${SLUG}".` },
      { status: 404 },
    );
  }

  const variants = Array.isArray(doc.variants) ? doc.variants : [];
  const updatedVariants = variants.map((v) => ({
    ...v,
    price,
    comparePrice: compare,
  }));

  const updated = await payload.update({
    collection: "products",
    id: doc.id,
    overrideAccess: true,
    data: {
      fromPrice: price,
      comparePrice: compare,
      ...(updatedVariants.length > 0 ? { variants: updatedVariants } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    slug: SLUG,
    price,
    compare,
    variantsUpdated: updatedVariants.length,
    result: {
      fromPrice: (updated as { fromPrice?: unknown }).fromPrice,
      comparePrice: (updated as { comparePrice?: unknown }).comparePrice,
    },
    note: "Hard-refresh the product page to see From £109 with £149 struck through.",
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
