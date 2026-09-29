/**
 * Shape, shipped copy and validation for the product pages (/shop/<slug>)
 * and the shop listing (/shop).
 *
 * A product page is built from two sources. The dashboard owns what is sold -
 * the name, description, photos, doses and prices. This file owns the page
 * copy around it: the lists under the price, "What is …?", the safety block
 * and its questions, and the comparison table. The copy that ships lives in
 * lib/pdp-products.ts; anything stored here is laid over it field by field.
 *
 * A product with no shipped copy (one added in the dashboard, such as
 * Foundayo) starts blank, and its medicine-specific sections stay hidden
 * until someone writes them - the rule in lib/pdp-products.ts's
 * blankEditorial, which this keeps.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor can
 * import it. `lib/productPageContent.ts` is the server-side reader.
 */
import {
  COMPARISON_TABLE,
  PDP_FAQS,
  PDP_PRODUCTS,
  blankEditorial,
  type ComparisonRow,
  type GraphPoint,
  type PDPProduct,
} from "@/lib/pdp-products";
import {
  CATEGORY_PAGE_DEFAULT,
  type UspItem,
} from "@/lib/categoryPageContentTypes";
import {
  PRODUCT_STYLE_KEYS,
  mergeStyles,
  type ProductStyleKey,
  type SectionStyle,
} from "@/lib/sectionStyle";
import {
  COMPARISON_TEXT_KEYS,
  PRODUCT_TEXT_KEYS,
  SHOP_TEXT_KEYS,
  mergeTextStyles,
  type ComparisonTextKey,
  type ProductTextKey,
  type ShopTextKey,
  type TextStyle,
} from "@/lib/textStyle";

export type IconLabel = { icon: string; label: string };
export type ProductFaq = { q: string; a: string };

/** The page copy one product page carries, all of it editable. */
export type ProductCopy = {
  /** The word in the rating pill above the heading. */
  ratingPillLabel: string;
  /** Above the dose cards. */
  strengthHeading: string;
  /** Under the price; empty hides it. */
  priceNote: string;
  /** The button under the price. */
  eligibilityCta: string;
  /** Serif italic after the product name in the page heading. */
  italicWord: string;
  trustLine: string[];
  serviceChips: IconLabel[];
  whyChooseTitle: string;
  features: IconLabel[];

  howItWorksTitle: string;
  /** Empty means the sentence built from the product's name. */
  howItWorksBody: string;

  whatIsTitle: string;
  whatIsBody: string;
  whatIsCalloutTitle: string;
  whatIsCallout: string;
  whatIsBullets: string[];
  whatIsCtaLabel: string;
  whatIsCtaHref: string;
  graphCallout: string;
  graphPoints: GraphPoint[];

  safetyTitle: string;
  safetyBody: string;
  sideEffectsHeading: string;
  safetySideEffects: string;
  faqs: ProductFaq[];
  safetyCtaLabel: string;
  safetyCtaHref: string;
  safetyImage: string;
  safetyImageAlt: string;
  /** Per-section background / text colour for this product's page. */
  styles: Record<ProductStyleKey, SectionStyle>;
  /** Per-text size and weight for this product's page. */
  textStyles: Record<ProductTextKey, TextStyle>;
};

export type ComparisonColumns = {
  wegovyTablet: string;
  mounjaro: string;
  wegovy: string;
};

export type ComparisonContent = {
  heading: string;
  body: string;
  columns: ComparisonColumns;
  rows: ComparisonRow[];
  /** The line under the table. */
  note: string;
  /** One table for every product, so one set of colours and sizes. */
  style: SectionStyle;
  textStyles: Record<ComparisonTextKey, TextStyle>;
};

export type ShopPageContent = {
  heading: string;
  headingAccent: string;
  footnote: string;
  /** The button on each product card. */
  cardCta: string;
  style: SectionStyle;
  textStyles: Record<ShopTextKey, TextStyle>;
};

/** The scrolling strip under the price - one strip for every product page. */
export type ProductUsp = {
  items: UspItem[];
  style: SectionStyle;
  textStyles: Record<string, TextStyle>;
};

export const PRODUCT_USP_DEFAULT: ProductUsp = {
  items: CATEGORY_PAGE_DEFAULT.uspStrip.items,
  style: mergeStyles(null, ["usp"] as const).usp,
  textStyles: mergeTextStyles(null, ["uspStrip.itemLabel"] as const),
};

export function mergeProductUsp(stored: unknown): ProductUsp {
  const s = obj(stored);
  const items = Array.isArray(s.items)
    ? s.items
        .map(obj)
        .map((r) => ({ icon: String(r.icon ?? ""), label: String(r.label ?? "") }))
        .filter((r) => r.label.trim() !== "")
    : [];
  return {
    items: items.length ? items : PRODUCT_USP_DEFAULT.items,
    style: mergeStyles({ usp: s.style }, ["usp"] as const).usp,
    textStyles: mergeTextStyles(s.textStyles, ["uspStrip.itemLabel"] as const),
  };
}

export type ProductPagesContent = {
  /** Keyed by product slug. Only products with stored copy appear. */
  products: Record<string, ProductCopy>;
  comparison: ComparisonContent;
  shop: ShopPageContent;
};

/* ── shipped copy ───────────────────────────────────────── */

const SAFETY_IMAGE = "/assets/category/wl-checkin.png";
const SAFETY_IMAGE_ALT = "Monthly video check-in with a licensed clinician";

export const COMPARISON_DEFAULT: ComparisonContent = {
  heading: "Which treatment is right for you?",
  body: "Compare our most popular weight loss treatments.",
  columns: {
    wegovyTablet: "Wegovy Pills",
    mounjaro: "Mounjaro KwikPen",
    wegovy: "Wegovy Injection",
  },
  rows: COMPARISON_TABLE,
  note: "Our UK clinicians will recommend the most appropriate treatment following an individual clinical assessment.",
  style: mergeStyles(null, ["table"] as const).table,
  textStyles: mergeTextStyles(null, COMPARISON_TEXT_KEYS),
};

export const SHOP_DEFAULT: ShopPageContent = {
  heading: "Weight loss solutions",
  headingAccent: "for you.",
  footnote:
    "*Prices shown are starting prices. Final cost depends on your treatment plan after clinical review.",
  cardCta: "Get Started",
  style: mergeStyles(null, ["shop"] as const).shop,
  textStyles: mergeTextStyles(null, SHOP_TEXT_KEYS),
};

/**
 * The questions a product page shows when none are stored.
 *
 * The shared list is written about Mounjaro, and the page has always swapped
 * the first "Mounjaro" in each line for the product's own name. Doing the
 * same here means the editor opens on exactly what the page shows - so a
 * product whose questions still read wrongly can be seen, and fixed, as it
 * is.
 */
export function shippedFaqs(productTitle: string): ProductFaq[] {
  return PDP_FAQS.map((f) => ({
    q: f.q.replace("Mounjaro", productTitle),
    a: (f.a ?? "").replace("Mounjaro", productTitle),
  }));
}

/**
 * What a product page shows with nothing stored.
 *
 * `hasShippedCopy` is false for a product added in the dashboard: every
 * medicine-specific field is then blank, and so are its questions.
 */
export function shippedCopy(slug: string, productTitle: string): ProductCopy {
  const shipped = PDP_PRODUCTS[slug];
  const p: PDPProduct = shipped ?? blankEditorial(productTitle);
  return {
    ratingPillLabel: "Trustpilot",
    strengthHeading: "Select your strength",
    priceNote: "per 4-week pen",
    eligibilityCta: "Check if I'm Eligible",
    italicWord: p.italicWord,
    trustLine: p.trustLine,
    serviceChips: p.serviceChips,
    whyChooseTitle: "Why choose Jood?",
    features: p.features,
    howItWorksTitle: "How it works",
    howItWorksBody: "",
    whatIsTitle: p.whatIsTitle,
    whatIsBody: p.whatIsBody,
    whatIsCalloutTitle: p.whatIsCalloutTitle ?? "",
    whatIsCallout: p.whatIsCallout,
    whatIsBullets: p.whatIsBullets,
    whatIsCtaLabel: "Get started",
    whatIsCtaHref: "/consultation",
    graphCallout: p.graph.callout,
    graphPoints: p.graph.points,
    safetyTitle: p.safetyTitle,
    safetyBody: p.safetyBody,
    sideEffectsHeading: "What are the common side effects?",
    safetySideEffects: p.safetySideEffects,
    faqs: shipped ? shippedFaqs(productTitle) : [],
    safetyCtaLabel: "Check Eligible",
    safetyCtaHref: "/consultation?product=weight-loss",
    safetyImage: SAFETY_IMAGE,
    safetyImageAlt: SAFETY_IMAGE_ALT,
    styles: mergeStyles(null, PRODUCT_STYLE_KEYS),
    textStyles: mergeTextStyles(null, PRODUCT_TEXT_KEYS),
  };
}

/** A product with its page copy laid over it, ready for the components. */
export function applyCopy(p: PDPProduct, c: ProductCopy): PDPProduct {
  return {
    ...p,
    ratingPillLabel: c.ratingPillLabel,
    strengthHeading: c.strengthHeading,
    priceNote: c.priceNote,
    eligibilityCta: c.eligibilityCta,
    italicWord: c.italicWord,
    trustLine: c.trustLine,
    serviceChips: c.serviceChips,
    whyChooseTitle: c.whyChooseTitle,
    features: c.features,
    howItWorksTitle: c.howItWorksTitle,
    howItWorksBody: c.howItWorksBody,
    whatIsTitle: c.whatIsTitle,
    whatIsBody: c.whatIsBody,
    whatIsCalloutTitle: c.whatIsCalloutTitle,
    whatIsCallout: c.whatIsCallout,
    whatIsBullets: c.whatIsBullets,
    whatIsCtaLabel: c.whatIsCtaLabel,
    whatIsCtaHref: c.whatIsCtaHref,
    graph: {
      ...p.graph,
      // A product that started blank has no scale; use the one every
      // shipped product uses, so a graph written in the CMS can be drawn.
      yLabels: p.graph.yLabels.length ? p.graph.yLabels : [100, 94, 88, 82, 76, 70],
      minWeight: p.graph.yLabels.length ? p.graph.minWeight : 70,
      maxWeight: p.graph.yLabels.length ? p.graph.maxWeight : 100,
      callout: c.graphCallout,
      points: c.graphPoints,
      xLabels: c.graphPoints.map((pt) => pt.x),
    },
    safetyTitle: c.safetyTitle,
    safetyBody: c.safetyBody,
    sideEffectsHeading: c.sideEffectsHeading,
    safetySideEffects: c.safetySideEffects,
    faqs: c.faqs,
    safetyCtaLabel: c.safetyCtaLabel,
    safetyCtaHref: c.safetyCtaHref,
    safetyImage: c.safetyImage,
    safetyImageAlt: c.safetyImageAlt,
    textStyles: c.textStyles,
  };
}

/** The sentence under "How it works" when none is stored. */
export function howItWorksFallback(productTitle: string): string {
  return `Get prescribed ${productTitle} after a quick online consultation. We deliver to your door and support you through every step.`;
}

/* ── validation ─────────────────────────────────────────── */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** Fields a product may leave blank on purpose - a blank hides the block. */
function optStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** A stored list replaces the shipped one, even when emptied on purpose. */
function strList(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

function rows<T>(
  v: unknown,
  make: (r: Record<string, unknown>) => T,
  keep: (r: T) => boolean,
  fallback: T[],
): T[] {
  if (!Array.isArray(v)) return fallback;
  return v.map(obj).map(make).filter(keep);
}

function iconLabels(v: unknown, fallback: IconLabel[]): IconLabel[] {
  return rows<IconLabel>(
    v,
    (r) => ({ icon: String(r.icon ?? ""), label: String(r.label ?? "") }),
    (r) => r.label.trim() !== "",
    fallback,
  );
}

/**
 * One product's stored copy laid over what it ships with.
 *
 * Unlike the other pages, a product's medicine-specific text may be cleared
 * on purpose, because a blank "What is …?" or safety title is how a section
 * is hidden - so those use optStr rather than falling back.
 */
export function mergeProductCopy(
  stored: unknown,
  slug: string,
  productTitle: string,
): ProductCopy {
  const s = obj(stored);
  const B = shippedCopy(slug, productTitle);
  return {
    ratingPillLabel: str(s.ratingPillLabel, B.ratingPillLabel),
    strengthHeading: str(s.strengthHeading, B.strengthHeading),
    priceNote: optStr(s.priceNote, B.priceNote),
    eligibilityCta: str(s.eligibilityCta, B.eligibilityCta),
    italicWord: optStr(s.italicWord, B.italicWord),
    trustLine: strList(s.trustLine, B.trustLine),
    serviceChips: iconLabels(s.serviceChips, B.serviceChips),
    whyChooseTitle: optStr(s.whyChooseTitle, B.whyChooseTitle),
    features: iconLabels(s.features, B.features),
    howItWorksTitle: str(s.howItWorksTitle, B.howItWorksTitle),
    howItWorksBody: optStr(s.howItWorksBody, B.howItWorksBody),
    whatIsTitle: optStr(s.whatIsTitle, B.whatIsTitle),
    whatIsBody: optStr(s.whatIsBody, B.whatIsBody),
    whatIsCalloutTitle: optStr(s.whatIsCalloutTitle, B.whatIsCalloutTitle),
    whatIsCallout: optStr(s.whatIsCallout, B.whatIsCallout),
    whatIsBullets: strList(s.whatIsBullets, B.whatIsBullets),
    whatIsCtaLabel: optStr(s.whatIsCtaLabel, B.whatIsCtaLabel),
    whatIsCtaHref: str(s.whatIsCtaHref, B.whatIsCtaHref),
    graphCallout: optStr(s.graphCallout, B.graphCallout),
    graphPoints: rows<GraphPoint>(
      s.graphPoints,
      (r) => ({ x: String(r.x ?? ""), weight: Number(r.weight) }),
      (r) => r.x.trim() !== "" && Number.isFinite(r.weight),
      B.graphPoints,
    ),
    safetyTitle: optStr(s.safetyTitle, B.safetyTitle),
    safetyBody: optStr(s.safetyBody, B.safetyBody),
    sideEffectsHeading: optStr(s.sideEffectsHeading, B.sideEffectsHeading),
    safetySideEffects: optStr(s.safetySideEffects, B.safetySideEffects),
    faqs: rows<ProductFaq>(
      s.faqs,
      (r) => ({ q: String(r.q ?? ""), a: String(r.a ?? "") }),
      (r) => r.q.trim() !== "" && r.a.trim() !== "",
      B.faqs,
    ),
    safetyCtaLabel: optStr(s.safetyCtaLabel, B.safetyCtaLabel),
    safetyCtaHref: str(s.safetyCtaHref, B.safetyCtaHref),
    safetyImage: str(s.safetyImage, B.safetyImage),
    safetyImageAlt: optStr(s.safetyImageAlt, B.safetyImageAlt),
    styles: mergeStyles(s.styles, PRODUCT_STYLE_KEYS),
    textStyles: mergeTextStyles(s.textStyles, PRODUCT_TEXT_KEYS),
  };
}

export function mergeComparison(stored: unknown): ComparisonContent {
  const s = obj(stored);
  const B = COMPARISON_DEFAULT;
  const c = obj(s.columns);
  return {
    heading: str(s.heading, B.heading),
    body: optStr(s.body, B.body),
    note: optStr(s.note, B.note),
    columns: {
      wegovyTablet: str(c.wegovyTablet, B.columns.wegovyTablet),
      mounjaro: str(c.mounjaro, B.columns.mounjaro),
      wegovy: str(c.wegovy, B.columns.wegovy),
    },
    rows: (() => {
      const out = rows<ComparisonRow>(
        s.rows,
        (r) => ({
          label: String(r.label ?? ""),
          mounjaro: String(r.mounjaro ?? ""),
          wegovy: String(r.wegovy ?? ""),
          wegovyTablet: String(r.wegovyTablet ?? ""),
        }),
        (r) => r.label.trim() !== "",
        B.rows,
      );
      // An empty table is never what anyone meant.
      return out.length ? out : B.rows;
    })(),
    style: mergeStyles({ table: s.style }, ["table"] as const).table,
    textStyles: mergeTextStyles(s.textStyles, COMPARISON_TEXT_KEYS),
  };
}

export function mergeShop(stored: unknown): ShopPageContent {
  const s = obj(stored);
  return {
    heading: str(s.heading, SHOP_DEFAULT.heading),
    headingAccent: optStr(s.headingAccent, SHOP_DEFAULT.headingAccent),
    footnote: optStr(s.footnote, SHOP_DEFAULT.footnote),
    cardCta: str(s.cardCta, SHOP_DEFAULT.cardCta),
    style: mergeStyles({ shop: s.style }, ["shop"] as const).shop,
    textStyles: mergeTextStyles(s.textStyles, SHOP_TEXT_KEYS),
  };
}

/** The stored product map, validated but not yet laid over anything. */
export function storedProducts(stored: unknown): Record<string, unknown> {
  return obj(obj(stored).products);
}

/**
 * Keep the few tags the shipped copy uses - bold, italic, line break - and
 * escape everything else. "What is …?" is the one field rendered as markup.
 */
export function safeInlineHtml(src: string): string {
  const escaped = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return escaped
    .replace(/&lt;(\/?)(strong|em|b|i)&gt;/gi, "<$1$2>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br />");
}
