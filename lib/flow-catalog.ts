/**
 * Category-aware catalogue for the post-consultation "Choose your
 * treatment" page (final-product-page).
 *
 * The questionnaire the patient completes decides which category of
 * treatments they are shown:
 *   • weight-loss           → GLP-1 medications (Mounjaro / Wegovy / Wegovy Pill)
 *   • erectile-dysfunction  → ED tablets (Sildenafil / Tadalafil)
 *   • period-delay          → period-delay tablets (Norethisterone)
 *
 * Weight-loss products layer the dashboard-managed CMS variants on top of
 * the editorial PDP data (see final-product-page/page.tsx). ED and PD
 * products don't have editorial PDP entries, so their content lives here.
 */

export type FlowCategory = "weight-loss" | "erectile-dysfunction" | "period-delay";

export type CatalogDose = { label: string; price: number };

export type CatalogProduct = {
  slug: string;
  productId: number;
  title: string;
  italicWord: string;
  image: string;
  lede: string;
  /** Short one-line description shown on the selector row. */
  blurb: string;
  /** Marks the clinically recommended option (expanded by default). */
  recommended?: boolean;
  doses: CatalogDose[];
};

/** Maps any consultation productSlug to one of the three flow categories. */
export function resolveCategory(raw: string | undefined | null): FlowCategory {
  switch (raw) {
    case "erectile-dysfunction":
      return "erectile-dysfunction";
    case "period-delay":
      return "period-delay";
    // "weight-loss", "reorder", unknown → weight-loss
    default:
      return "weight-loss";
  }
}

/** Hero heading copy per category (plain + italic segment). */
export const CATEGORY_HEADING: Record<
  FlowCategory,
  { lead: string; italic: string; sub: string }
> = {
  "weight-loss": {
    lead: "Choose your",
    italic: "weight loss treatment",
    sub: "Based on your consultation, you can start any of the treatments below. A UK-licensed clinician reviews every order before dispatch.",
  },
  "erectile-dysfunction": {
    lead: "Choose your",
    italic: "erectile dysfunction treatment",
    sub: "Based on your consultation, you can start any of the treatments below. A UK-licensed clinician reviews every order before dispatch.",
  },
  "period-delay": {
    lead: "Choose your",
    italic: "period delay treatment",
    sub: "Based on your consultation, you can start any of the treatments below. A UK-licensed clinician reviews every order before dispatch.",
  },
};

/**
 * Editorial products for the ED and PD flows. Weight-loss is built
 * separately in the page (CMS variants + PDP editorial data).
 */
export const ED_PRODUCTS: CatalogProduct[] = [
  {
    slug: "tadalafil",
    productId: 2002,
    title: "Tadalafil",
    italicWord: "tablets",
    image: "/assets/category/ed-card.png",
    blurb: "Longer-lasting treatment that can work for up to 36 hours.",
    recommended: true,
    lede: "The active ingredient in Cialis. Longer-lasting ED treatment that can work for up to 36 hours, for more spontaneity.",
    doses: [
      { label: "10 mg", price: 22.0 },
      { label: "20 mg", price: 27.0 },
    ],
  },
  {
    slug: "sildenafil",
    productId: 2001,
    title: "Sildenafil",
    italicWord: "tablets",
    image: "/assets/category/ed-pill.png",
    blurb: "Clinically proven treatment taken about an hour before sex.",
    lede: "The active ingredient in Viagra. A clinically proven ED treatment taken about an hour before sex, effective for up to 4–5 hours.",
    doses: [
      { label: "25 mg", price: 19.0 },
      { label: "50 mg", price: 24.0 },
      { label: "100 mg", price: 29.0 },
    ],
  },
];

export const PD_PRODUCTS: CatalogProduct[] = [
  {
    slug: "norethisterone",
    productId: 3001,
    title: "Norethisterone",
    italicWord: "tablets",
    image: "/assets/category/pd-card.png",
    blurb: "Prescription tablet to safely delay your period.",
    recommended: true,
    lede: "A prescription tablet taken three times a day to safely delay your period, started a few days before it is due.",
    doses: [
      { label: "5 mg", price: 18.0 },
    ],
  },
];

/** Returns the editorial products for the non-weight-loss categories. */
export function getCatalogProducts(category: FlowCategory): CatalogProduct[] {
  if (category === "erectile-dysfunction") return ED_PRODUCTS;
  if (category === "period-delay") return PD_PRODUCTS;
  return [];
}
