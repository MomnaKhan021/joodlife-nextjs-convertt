import "server-only";

import { ED_PRODUCTS, PD_PRODUCTS } from "@/lib/flow-catalog";
import type { Db } from "./db";
import { asArray } from "./db";

/**
 * The treatment catalogue the portal shows (names, strengths, pack prices).
 * Weight loss comes from the products table, so prices match the shop. ED and
 * period delay come from the consultation flow's own catalogue
 * (lib/flow-catalog.ts). The clinical copy (how it's taken, how long it
 * works) is per medicine and lives here.
 */

export type Svc = "wl" | "ed" | "pd";

export type Pack = { q: number; label: string; price: number };
export type Strength = { s: string; packs: Pack[] };
export type PortalProduct = {
  id: string;
  name: string;
  generic: string;
  form: string;
  freq: "weekly" | "daily" | "asneeded" | "course";
  window?: number;
  onset?: string;
  strengths: Strength[];
};
export type Catalogue = Record<
  Svc,
  { key: Svc; name: string; short?: string; tag: string; from: string; products: PortalProduct[] }
>;

type Meta = Omit<PortalProduct, "id" | "name" | "strengths"> & { packQ: number; packLabel: string };

const META: Array<[RegExp, Meta]> = [
  [/wegovy[-_ ]?pill|oral[-_ ]?semaglutide/i, { generic: "oral semaglutide", form: "Daily tablet", freq: "daily", packQ: 30, packLabel: "30 tablets" }],
  [/foundayo|orforglipron/i, { generic: "orforglipron", form: "Daily tablet", freq: "daily", packQ: 30, packLabel: "30 tablets" }],
  [/mounjaro|tirzepatide/i, { generic: "tirzepatide", form: "Weekly injection pen", freq: "weekly", packQ: 4, packLabel: "4-week supply" }],
  [/wegovy|semaglutide|ozempic/i, { generic: "semaglutide", form: "Weekly injection pen", freq: "weekly", packQ: 4, packLabel: "4-week supply" }],
  [/saxenda|liraglutide/i, { generic: "liraglutide", form: "Daily injection pen", freq: "daily", packQ: 30, packLabel: "30-day supply" }],
  [/tadalafil[-_ ]?daily/i, { generic: "low-dose tadalafil", form: "One tablet every day", freq: "daily", window: 24, onset: "builds up over 5 days", packQ: 28, packLabel: "28 tablets" }],
  [/tadalafil|cialis/i, { generic: "generic Cialis", form: "Tablet, as needed", freq: "asneeded", window: 36, onset: "30 minutes to 2 hours", packQ: 4, packLabel: "4 tablets" }],
  [/sildenafil|viagra/i, { generic: "generic Viagra", form: "Tablet, as needed", freq: "asneeded", window: 4, onset: "30–60 minutes", packQ: 4, packLabel: "4 tablets" }],
  [/norethisterone|period/i, { generic: "5 mg tablets", form: "3 tablets a day", freq: "course", packQ: 30, packLabel: "30 tablets" }],
];

const FALLBACK: Record<Svc, Meta> = {
  wl: { generic: "", form: "Weight loss treatment", freq: "weekly", packQ: 4, packLabel: "4-week supply" },
  ed: { generic: "", form: "Tablet, as needed", freq: "asneeded", window: 4, onset: "30–60 minutes", packQ: 4, packLabel: "4 tablets" },
  pd: { generic: "", form: "3 tablets a day", freq: "course", packQ: 30, packLabel: "30 tablets" },
};

export function metaFor(slugOrName: string, svc: Svc): Meta {
  for (const [re, m] of META) if (re.test(slugOrName)) return m;
  return FALLBACK[svc];
}

/** "2.5mg" → "2.5 mg"; anything else is trimmed and kept. */
export function normStrength(label: string): string {
  const s = String(label ?? "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*mg\b(.*)$/i);
  return m ? `${m[1]} mg${m[2] ? m[2] : ""}`.trim() : s;
}

/** Comparable key for a dose label: "2.5 mg" / "2.5mg" / "2.5" → "2.5". */
export function doseKey(label: unknown): string {
  return String(label ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(/mg$/, "");
}

function money(n: number): string {
  return "£" + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

function productFrom(id: string, name: string, svc: Svc, doses: Array<{ label: string; price: number }>): PortalProduct {
  const m = metaFor(id + " " + name, svc);
  const { packQ, packLabel, ...meta } = m;
  return {
    id,
    name,
    ...meta,
    strengths: doses
      .filter((d) => d && d.label && Number.isFinite(Number(d.price)))
      .map((d) => ({ s: normStrength(d.label), packs: [{ q: packQ, label: packLabel, price: Number(d.price) }] })),
  };
}

async function weightLossProducts(db: Db): Promise<PortalProduct[]> {
  try {
    const rows = await db.query(
      `SELECT slug, title, from_price, variants_json FROM "products"
       WHERE treatment = 'weight-loss' AND COALESCE(is_active, true) = true
       ORDER BY display_order NULLS LAST, title`,
    );
    return rows
      .map((r) => {
        const doses = asArray(r.variants_json).map((v) => ({
          label: String(v.label ?? v.size ?? ""),
          price: Number(v.price),
        }));
        if (!doses.length && r.from_price != null) doses.push({ label: "Starting dose", price: Number(r.from_price) });
        return productFrom(String(r.slug), String(r.title ?? r.slug), "wl", doses);
      })
      .filter((p) => p.strengths.length);
  } catch {
    return [];
  }
}

export async function buildCatalogue(db: Db): Promise<Catalogue> {
  const wl = await weightLossProducts(db);
  const ed = ED_PRODUCTS.map((p) => productFrom(p.slug, p.title, "ed", p.doses));
  const pd = PD_PRODUCTS.map((p) => productFrom(p.slug, p.title, "pd", p.doses));
  const from = (ps: PortalProduct[], fallback: string) => {
    const prices = ps.flatMap((p) => p.strengths.flatMap((s) => s.packs.map((k) => k.price))).filter((n) => n > 0);
    return prices.length ? money(Math.min(...prices)) : fallback;
  };
  return {
    wl: { key: "wl", name: "Weight loss", tag: "Clinician-led programme", from: from(wl, "£99"), products: wl },
    ed: { key: "ed", name: "Erectile dysfunction", short: "ED", tag: "Men's health", from: from(ed, "£19"), products: ed },
    pd: { key: "pd", name: "Period delay", tag: "Women's health", from: from(pd, "£18"), products: pd },
  };
}

/**
 * Make sure a medicine a patient actually ordered is in the catalogue, even if
 * it has since been retired from the shop, so their history still renders.
 */
export function ensureProduct(cat: Catalogue, svc: Svc, title: string, strength: string, price: number | null): PortalProduct {
  const want = doseKey(strength);
  const name = title.replace(/\s*\(.*\)\s*$/, "").trim() || cat[svc].name;
  const found =
    cat[svc].products.find((p) => p.name.toLowerCase() === name.toLowerCase()) ??
    cat[svc].products.find((p) => name.toLowerCase().includes(p.name.toLowerCase()) || p.id === name.toLowerCase()) ??
    cat[svc].products.find((p) => metaFor(p.id + " " + p.name, svc) === metaFor(name, svc) && metaFor(name, svc) !== FALLBACK[svc]);
  const product =
    found ??
    (() => {
      const p = productFrom(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, svc, []);
      cat[svc].products.push(p);
      return p;
    })();
  if (strength && !product.strengths.some((s) => doseKey(s.s) === want)) {
    const m = metaFor(product.id + " " + product.name, svc);
    product.strengths.push({ s: normStrength(strength), packs: [{ q: m.packQ, label: m.packLabel, price: price ?? 0 }] });
  }
  if (!product.strengths.length) {
    const m = metaFor(product.id + " " + product.name, svc);
    product.strengths.push({ s: strength || "As prescribed", packs: [{ q: m.packQ, label: m.packLabel, price: price ?? 0 }] });
  }
  return product;
}

/** Which service a consultation / product slug or title belongs to. */
export function serviceOf(slugOrTitle: unknown): Svc | null {
  const s = String(slugOrTitle ?? "").toLowerCase().trim();
  if (!s) return null;
  if (/erectile|^ed$|sildenafil|tadalafil|viagra|cialis/.test(s)) return "ed";
  if (/period|^pd$|norethisterone/.test(s)) return "pd";
  if (/weight|^wl$|mounjaro|tirzepatide|wegovy|ozempic|semaglutide|saxenda|liraglutide|foundayo|orforglipron/.test(s)) return "wl";
  return null;
}
