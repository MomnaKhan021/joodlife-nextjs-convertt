/**
 * Admin-only: (re)populate the storefront product catalogue.
 *
 * The `products` table is empty in this environment, so both /shop and the
 * dashboard Products tab show nothing. Visiting this endpoint while signed in
 * as an admin inserts the standard Jood catalogue (Mounjaro / Wegovy /
 * Wegovy Pills) with their dosage variants — idempotent, so it skips any slug
 * that already exists and never overwrites edits you've made.
 *
 * Prices are the standard defaults; adjust them per product in the dashboard
 * (Products → a product → edit) afterwards.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Variant = { label: string; price: number };
type SeedProduct = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  treatment: "weight-loss";
  fromPrice: number;
  displayOrder: number;
  variants: Variant[];
};

const CATALOGUE: SeedProduct[] = [
  {
    slug: "mounjaro",
    title: "Mounjaro",
    tagline: "Once-weekly weight-loss injection (tirzepatide)",
    description:
      "A once-weekly prescription treatment for weight management. Every order includes an individual clinician assessment, ongoing support and fast UK delivery.",
    treatment: "weight-loss",
    fromPrice: 112,
    displayOrder: 1,
    variants: [
      { label: "2.5 mg", price: 90 },
      { label: "5 mg", price: 135 },
      { label: "7.5 mg", price: 190 },
      { label: "10 mg", price: 220 },
      { label: "12.5 mg", price: 260 },
      { label: "15 mg", price: 295 },
    ],
  },
  {
    slug: "wegovy",
    title: "Wegovy",
    tagline: "Once-weekly weight-loss injection (semaglutide)",
    description:
      "A once-weekly prescription treatment for weight management. Every order includes an individual clinician assessment, ongoing support and fast UK delivery.",
    treatment: "weight-loss",
    fromPrice: 99,
    displayOrder: 2,
    variants: [
      { label: "0.25 mg", price: 70 },
      { label: "0.5 mg", price: 105 },
      { label: "1 mg", price: 160 },
      { label: "1.7 mg", price: 195 },
      { label: "2.4 mg", price: 240 },
    ],
  },
  {
    slug: "wegovy-pill",
    title: "Wegovy Pills",
    tagline: "Daily weight-loss tablet (semaglutide) — needle-free",
    description:
      "A needle-free, once-daily prescription tablet for weight management. Every order includes an individual clinician assessment, ongoing support and fast UK delivery.",
    treatment: "weight-loss",
    fromPrice: 149,
    displayOrder: 3,
    variants: [
      { label: "1.5 mg", price: 149 },
      { label: "4 mg", price: 149 },
    ],
  },
];

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(_req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }

  const created: string[] = [];
  const skipped: string[] = [];
  const failed: Array<{ slug: string; error: string }> = [];

  for (const p of CATALOGUE) {
    try {
      const existing = await payload.find({
        collection: "products",
        where: { slug: { equals: p.slug } },
        limit: 1,
        overrideAccess: true,
      });
      if (existing.docs.length > 0) {
        skipped.push(p.slug);
        continue;
      }
      await payload.create({
        collection: "products",
        overrideAccess: true,
        data: {
          title: p.title,
          slug: p.slug,
          tagline: p.tagline,
          description: p.description,
          category: "medication",
          treatment: p.treatment,
          fromPrice: p.fromPrice,
          displayOrder: p.displayOrder,
          isActive: true,
          variants: p.variants.map((v) => ({
            label: v.label,
            price: v.price,
            stock: 100,
          })),
        },
      });
      created.push(p.slug);
    } catch (err) {
      failed.push({ slug: p.slug, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    ok: failed.length === 0,
    created,
    skipped,
    failed,
    note: "Adjust prices/details per product in the dashboard (Products → edit).",
  });
}
