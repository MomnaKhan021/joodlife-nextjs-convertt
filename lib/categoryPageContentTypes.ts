import { CATEGORY_FAQS, type Faq } from "@/lib/categoryFaqs";

/**
 * Shape, shipped copy and validation for the shared furniture on the
 * treatment sub-pages (/period-delay, /erectile-dysfunction, /weight-loss).
 *
 * The themed hero at the top of each page already comes from the Treatments
 * global; what lives here is everything those pages carried as literals: the
 * scrolling trust strip, the dark "more than treatment" panel, and the FAQ
 * list for each category.
 *
 * Client-safe (no `server-only`, no Payload import) so the /cms editor and
 * the pages' client components can import it. `lib/categoryPageContent.ts`
 * is the server-side reader.
 */

export type { Faq };

export type UspItem = { icon: string; label: string };

export type Feature = { icon: string; title: string; copy: string };

export type CategoryUspStrip = { items: UspItem[] };

export type CategoryFeatureGrid = {
  heading: string;
  headingAccent: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  features: Feature[];
};

/** One FAQ block: shared heading, per-category questions. */
export type CategoryFaqs = {
  heading: string;
  headingAccent: string;
  weightLoss: Faq[];
  erectileDysfunction: Faq[];
  periodDelay: Faq[];
};

export type CategoryPageContent = {
  uspStrip: CategoryUspStrip;
  featureGrid: CategoryFeatureGrid;
  faqs: CategoryFaqs;
};

export const CATEGORY_PAGE_DEFAULT: CategoryPageContent = {
  uspStrip: {
    items: [
      { icon: "/assets/figma/usp-licensed.svg", label: "UK Licensed medication" },
      { icon: "/assets/figma/usp-whatsapp.svg", label: "24-Hour WhatsApp support" },
      { icon: "/assets/figma/usp-delivery.svg", label: "Free next-day delivery" },
      { icon: "/assets/figma/usp-cancel.svg", label: "Cancel anytime subscription" },
      { icon: "/assets/figma/usp-support.svg", label: "Ongoing medical support" },
    ],
  },

  featureGrid: {
    heading: "It’s more than treatment, it’s",
    headingAccent: "transformation",
    body: "Your clinician will review your health and create a personalised treatment plan tailored to your individual needs.",
    ctaLabel: "Start Your Journey",
    ctaHref: "/shop",
    secondaryLabel: "Discover Wegovy Tablets",
    secondaryHref: "/wegovy-pills",
    features: [
      {
        icon: "/assets/figma/feature-effective.svg",
        title: "Medication",
        copy: "Clinically appropriate treatment",
      },
      {
        icon: "/assets/figma/feature-support.svg",
        title: "Support",
        copy: "Ongoing clinician support",
      },
      {
        icon: "/assets/figma/feature-progress.svg",
        title: "Progress",
        copy: "Personalised care",
      },
      {
        icon: "/assets/figma/feature-delivery.svg",
        title: "Delivery",
        copy: "Free next-day delivery",
      },
      {
        icon: "/assets/figma/feature-consult.svg",
        title: "Guidance",
        copy: "Long-term support",
      },
      {
        icon: "/assets/figma/feature-support.svg",
        title: "WhatsApp",
        copy: "24/7 support",
      },
    ],
  },

  faqs: {
    heading: "Frequently asked",
    headingAccent: "questions",
    weightLoss: CATEGORY_FAQS["weight-loss"],
    erectileDysfunction: CATEGORY_FAQS["erectile-dysfunction"],
    periodDelay: CATEGORY_FAQS["period-delay"],
  },
};

/** Which stored field holds which category's questions. */
export const FAQ_FIELD = {
  "weight-loss": "weightLoss",
  "erectile-dysfunction": "erectileDysfunction",
  "period-delay": "periodDelay",
} as const;

export type FaqCategory = keyof typeof FAQ_FIELD;

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function optStr(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function rows<T>(
  v: unknown,
  make: (r: Record<string, unknown>) => T,
  keep: (r: T) => boolean,
  fallback: T[],
): T[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.map(obj).map(make).filter(keep);
  return out.length ? out : fallback;
}

function toFaqs(v: unknown, fallback: Faq[]): Faq[] {
  return rows<Faq>(
    v,
    (r) => ({ q: String(r.q ?? ""), a: String(r.a ?? "") }),
    (r) => r.q.trim() !== "" && r.a.trim() !== "",
    fallback,
  );
}

/**
 * Merge a stored global over the shipped copy, field by field, so a
 * half-filled global still renders complete pages.
 */
export function mergeCategoryPage(stored: unknown): CategoryPageContent {
  const d = obj(stored);
  const B = CATEGORY_PAGE_DEFAULT;

  const u = obj(d.uspStrip);
  const g = obj(d.featureGrid);
  const f = obj(d.faqs);

  return {
    uspStrip: {
      items: rows<UspItem>(
        u.items,
        (r) => ({ icon: String(r.icon ?? ""), label: String(r.label ?? "") }),
        (r) => r.label.trim() !== "",
        B.uspStrip.items,
      ),
    },
    featureGrid: {
      heading: str(g.heading, B.featureGrid.heading),
      headingAccent: str(g.headingAccent, B.featureGrid.headingAccent),
      body: str(g.body, B.featureGrid.body),
      ctaLabel: optStr(g.ctaLabel, B.featureGrid.ctaLabel),
      ctaHref: str(g.ctaHref, B.featureGrid.ctaHref),
      secondaryLabel: optStr(
        g.secondaryLabel,
        B.featureGrid.secondaryLabel,
      ),
      secondaryHref: str(g.secondaryHref, B.featureGrid.secondaryHref),
      features: rows<Feature>(
        g.features,
        (r) => ({
          icon: String(r.icon ?? ""),
          title: String(r.title ?? ""),
          copy: String(r.copy ?? ""),
        }),
        (r) => r.title.trim() !== "",
        B.featureGrid.features,
      ),
    },
    faqs: {
      heading: str(f.heading, B.faqs.heading),
      headingAccent: str(f.headingAccent, B.faqs.headingAccent),
      weightLoss: toFaqs(f.weightLoss, B.faqs.weightLoss),
      erectileDysfunction: toFaqs(
        f.erectileDysfunction,
        B.faqs.erectileDysfunction,
      ),
      periodDelay: toFaqs(f.periodDelay, B.faqs.periodDelay),
    },
  };
}
