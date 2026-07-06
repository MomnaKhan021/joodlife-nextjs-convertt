/**
 * Static, content-driven product catalogue for the PDP UI.
 *
 * The CMS product (in `lib/products.ts`) provides the cart-critical
 * fields (id, price, variants). This file layers the editorial PDP
 * content — graph data, comparison table rows, safety FAQ, dosage
 * options — so every section of the Figma-based PDP can be rendered
 * dynamically per product without round-tripping the CMS.
 */

export type Dosage = {
  label: string;       // "2.5 mg"
  perPack: string;     // "£90.00"
  perMonth?: string;   // optional monthly price under the pack
};

export type GraphPoint = { x: string; weight: number };

export type ComparisonRow = {
  label: string;
  mounjaro: string;
  wegovy: string;
  /** Wegovy tablet (pill) column for the 3-product comparison table */
  wegovyTablet?: string;
};

export type PDPProduct = {
  slug: "mounjaro" | "wegovy" | "wegovy-pill";
  title: string;             // "Mounjaro"
  italicWord: string;        // "injection" — italic part of the H1
  /** Trustpilot summary line */
  ratingLabel: string;       // "4.5 Rated Excellence"
  /** Hero subtitle / lede paragraph */
  lede: string;
  /** Main gallery — first is the primary image, others are thumbnails. */
  gallery: { src: string; alt: string }[];
  /** Discount badge above the gallery (e.g. "26%") */
  discountBadge?: string;
  /** 4 mini-feature icons under the lede */
  features: { icon: string; label: string }[];
  /** Dosage cards — desktop renders 6 across; mobile wraps. */
  dosages: Dosage[];
  /** Lowest "from" price displayed under the dosage cards. */
  fromPrice: string;         // "£112.00"
  /** Three USP chips under the CTA */
  serviceChips: { icon: string; label: string }[];
  /** Trust line shown directly under the price (⭐ rating + proof points) */
  trustLine: string[];
  /** Description for the "What is X?" section */
  whatIsTitle: string;       // "What is Mounjaro?"
  whatIsBody: string;        // HTML-flavoured: <strong>…</strong>
  whatIsCalloutTitle?: string; // e.g. "How Mounjaro® may help"
  whatIsCallout: string;
  whatIsBullets: string[];
  /** Animated weight-loss graph */
  graph: {
    points: GraphPoint[];
    minWeight: number;
    maxWeight: number;
    yLabels: number[];   // numbers along the y-axis
    xLabels: string[];   // labels along the x-axis
    callout: string;     // "-27%"
  };
  /** "Is X safe?" section copy */
  safetyTitle: string;       // "Is Mounjaro safe?"
  safetyBody: string;
  safetySideEffects: string;
  /** "How it works" accordion lists for the dosage card */
  accordions: { q: string; a?: string }[];
  /** Comparison table — the table itself is shared but the active
   * column ("highlighted") differs per product. */
  comparisonActive: "mounjaro" | "wegovy" | "wegovyTablet";
  /** Final-product-page card: a headline efficacy stat and a short
   * list of benefits, shown on the "Choose your treatment" cards. */
  cardStat?: { percent: string; text: string };
  cardBenefits?: string[];
};

const SHARED_COMPARISON: ComparisonRow[] = [
  { label: "How it's taken",           mounjaro: "Weekly injection",          wegovy: "Weekly injection",   wegovyTablet: "Daily tablet" },
  { label: "Frequency",                mounjaro: "Once weekly",               wegovy: "Once weekly",        wegovyTablet: "Once daily" },
  { label: "Active ingredient",        mounjaro: "Tirzepatide",               wegovy: "Semaglutide",        wegovyTablet: "Semaglutide" },
  { label: "Needle-free",              mounjaro: "❌",                        wegovy: "❌",                 wegovyTablet: "✅" },
  { label: "May help regulate appetite", mounjaro: "★★★★★",                  wegovy: "★★★★☆",             wegovyTablet: "★★★★☆" },
  { label: "Feeling of fullness",      mounjaro: "Longer lasting",            wegovy: "Longer lasting",     wegovyTablet: "Longer lasting" },
  { label: "Convenience",              mounjaro: "★★★★★",                     wegovy: "★★★★★",             wegovyTablet: "★★★★★" },
  { label: "Best suited for",          mounjaro: "Maximum weight loss potential", wegovy: "Proven weekly treatment", wegovyTablet: "Needle-free treatment" },
];

export const COMPARISON_TABLE = SHARED_COMPARISON;

// "Why choose Jood?" bullets. `icon` here is an emoji rendered inline
// (the client copy specifies emoji/checkmarks verbatim).
const MOUNJARO_FEATURES = [
  { icon: "✔", label: "Clinician assessment" },
  { icon: "✔", label: "Personalised treatment plan" },
  { icon: "✔", label: "Ongoing support" },
  { icon: "✔", label: "Progress reviews" },
];

const WEGOVY_FEATURES = [
  { icon: "🩺", label: "Clinician assessment" },
  { icon: "💚", label: "Personalised treatment plan" },
  { icon: "📈", label: "Ongoing clinician support" },
  { icon: "📅", label: "Regular progress reviews" },
];

const SHARED_FEATURES = MOUNJARO_FEATURES;

// Delivery / trust chips under the CTA. `icon` is an emoji rendered inline.
const SHARED_SERVICE_CHIPS = [
  { icon: "🚚", label: "Free next-day delivery*" },
  { icon: "💬", label: "Ongoing clinician support" },
  { icon: "🔒", label: "Secure checkout" },
];

const SHARED_ACCORDIONS = [
  { q: "How it works" },
  { q: "Is Mounjaro safe?" },
];

const SHARED_FAQS = [
  { q: "Who should not use Mounjaro?", a: "Mounjaro isn't suitable for people who are pregnant, breastfeeding, under 18, or have certain medical conditions. Your clinician will assess your eligibility during your assessment." },
  { q: "How quickly does Mounjaro start working?", a: "Most patients begin to notice reduced appetite within the first week. Weight loss is typically gradual over several months." },
  { q: "Is Mounjaro a long-term treatment?", a: "Mounjaro is intended to be taken alongside lifestyle changes for as long as your clinician recommends." },
  { q: "How is Mounjaro taken?", a: "Mounjaro is a once-weekly subcutaneous injection that you self-administer at home." },
  { q: "What support do I receive during treatment?", a: "You get 24/7 access to our clinical team via WhatsApp and a monthly check-in to track your progress." },
];

export const PDP_PRODUCTS: Record<string, PDPProduct> = {
  mounjaro: {
    slug: "mounjaro",
    title: "Mounjaro®",
    italicWord: "Weight Loss Pen",
    ratingLabel: "4.4 Trustpilot",
    lede:
      "A once-weekly prescription treatment for weight management. Every order includes an individual clinician assessment, ongoing support and fast UK delivery.",
    gallery: [
      { src: "/assets/figma/pdp/mounjaro-1.png", alt: "Jood Mounjaro injection pen on a lavender background" },
      { src: "/assets/figma/pdp/mounjaro-2.png", alt: "Mounjaro injection pen close-up" },
      { src: "/assets/figma/pdp/mounjaro-3.png", alt: "Woman holding the Mounjaro injection at her waist" },
      { src: "/assets/figma/pdp/mounjaro-4.png", alt: "Mounjaro injection pen on a desk" },
    ],
    discountBadge: "26%",
    features: MOUNJARO_FEATURES,
    dosages: [
      { label: "2.5 mg",  perPack: "£90.00" },
      { label: "5 mg",    perPack: "£135.00" },
      { label: "7.5 mg",  perPack: "£190.00" },
      { label: "10 mg",   perPack: "£220.00" },
      { label: "12.5 mg", perPack: "£260.00" },
      { label: "15 mg",   perPack: "£295.00" },
    ],
    fromPrice: "£112.00",
    serviceChips: SHARED_SERVICE_CHIPS,
    trustLine: [
      "⭐⭐⭐⭐⭐ 4.4 Trustpilot",
      "Over 2,000 patients treated",
      "GPhC Registered Pharmacy",
    ],
    whatIsTitle: "What is Mounjaro®?",
    whatIsBody:
      "Mounjaro® (tirzepatide) is a prescription-only treatment for weight management. It helps regulate appetite, increase feelings of fullness and support sustainable weight loss when combined with healthy lifestyle changes.",
    whatIsCalloutTitle: "How Mounjaro® may help",
    whatIsCallout:
      "Many patients notice reduced appetite and increased fullness during the early stages of treatment.",
    whatIsBullets: [
      "✔ Helps regulate appetite",
      "✔ Increases feelings of fullness",
      "✔ Supports long-term weight management",
      "✔ Clinician-led, personalised care",
    ],
    graph: {
      points: [
        { x: "Start",    weight: 100 },
        { x: "Month 3",  weight: 90  },
        { x: "Month 4",  weight: 82  },
        { x: "Month 5",  weight: 76  },
        { x: "Month 6",  weight: 73  },
      ],
      minWeight: 70,
      maxWeight: 100,
      yLabels: [100, 94, 88, 82, 76, 70],
      xLabels: ["Start", "Month 3", "Month 4", "Month 5", "Month 6"],
      callout: "-27%",
    },
    safetyTitle: "Is Mounjaro safe?",
    safetyBody:
      "Mounjaro (tirzepatide) has been extensively studied in clinical trials and approved by the UK's MHRA. It is prescribed only after a clinical assessment to ensure it is safe and suitable for you. Your treatment is monitored throughout, with access to ongoing clinical support.",
    safetySideEffects:
      "The most common side effects are nausea, reduced appetite, vomiting, diarrhoea, or constipation, particularly when starting or increasing the dose. These are usually mild and temporary. Your clinician will guide you on managing side effects and adjusting treatment if needed.",
    accordions: SHARED_ACCORDIONS,
    comparisonActive: "mounjaro",
    cardStat: {
      percent: "90%",
      text: "of patients experience reduced appetite and early weight loss within the first few months.",
    },
    cardBenefits: [
      "Reduced appetite and cravings",
      "Supports long-term weight management",
      "May improve metabolic health",
      "Clinician-led, medically supervised treatment",
    ],
  },

  wegovy: {
    slug: "wegovy",
    title: "Wegovy®",
    italicWord: "Injection",
    ratingLabel: "4.4 Trustpilot",
    lede:
      "A once-weekly prescription treatment for weight management. Every order includes an individual clinician assessment, ongoing support and fast UK delivery.",
    gallery: [
      { src: "/assets/figma/pdp/wegovy-1.png", alt: "Wegovy injection pen on a soft background" },
      { src: "/assets/figma/pdp/wegovy-2.png", alt: "Wegovy injection pen close-up" },
      { src: "/assets/figma/pdp/wegovy-3.png", alt: "Person holding Wegovy" },
      { src: "/assets/figma/pdp/wegovy-4.png", alt: "Wegovy injection pen" },
    ],
    discountBadge: "20%",
    features: WEGOVY_FEATURES,
    dosages: [
      { label: "0.25 mg", perPack: "£70.00" },
      { label: "0.5 mg",  perPack: "£105.00" },
      { label: "1 mg",    perPack: "£160.00" },
      { label: "1.7 mg",  perPack: "£195.00" },
      { label: "2.4 mg",  perPack: "£240.00" },
    ],
    fromPrice: "£99.00",
    serviceChips: SHARED_SERVICE_CHIPS,
    trustLine: [
      "⭐⭐⭐⭐⭐ 4.4 Trustpilot",
      "Over 2,000 patients treated",
      "GPhC Registered Pharmacy",
    ],
    whatIsTitle: "What is Wegovy®?",
    whatIsBody:
      "Wegovy® (semaglutide) is a prescription-only treatment for weight management. It works by mimicking the natural GLP-1 hormone to help regulate appetite, increase feelings of fullness and support sustainable weight loss alongside healthy lifestyle changes.",
    whatIsCalloutTitle: "How Wegovy® may help",
    whatIsCallout:
      "Many patients notice reduced appetite and increased fullness during the early stages of treatment, alongside ongoing lifestyle changes.",
    whatIsBullets: [
      "✔ Helps regulate appetite",
      "✔ Increases feelings of fullness",
      "✔ Supports long-term weight management",
      "✔ Clinician-led, personalised care",
    ],
    graph: {
      points: [
        { x: "Start",    weight: 100 },
        { x: "Month 3",  weight: 93  },
        { x: "Month 4",  weight: 88  },
        { x: "Month 5",  weight: 84  },
        { x: "Month 6",  weight: 82  },
      ],
      minWeight: 70,
      maxWeight: 100,
      yLabels: [100, 94, 88, 82, 76, 70],
      xLabels: ["Start", "Month 3", "Month 4", "Month 5", "Month 6"],
      callout: "-18%",
    },
    safetyTitle: "Is Wegovy® safe?",
    safetyBody:
      "Wegovy® (semaglutide) is licensed by the MHRA for weight management. It is prescribed following an individual clinical assessment to ensure it's appropriate for you.",
    safetySideEffects:
      "Like all medicines, Wegovy® can cause side effects. The most common include nausea, diarrhoea, constipation and vomiting, particularly when starting treatment. Your clinician will guide you throughout your journey and help manage any side effects if they occur.",
    accordions: SHARED_ACCORDIONS,
    comparisonActive: "wegovy",
    cardStat: {
      percent: "80%",
      text: "of patients experience reduced appetite and early weight loss with once-weekly treatment.",
    },
    cardBenefits: [
      "Reduced appetite and cravings",
      "Supports long-term weight management",
      "Encourages healthier eating habits",
      "Clinician-led, medically supervised care",
    ],
  },

  "wegovy-pill": {
    slug: "wegovy-pill",
    title: "Wegovy Pill",
    italicWord: "tablet",
    ratingLabel: "4.4 Rated Excellence",
    lede:
      "A once-daily prescription tablet with the same trusted active ingredient as the Wegovy injection — semaglutide — for clinically guided weight loss, without weekly injections.",
    gallery: [
      { src: "/assets/wegovy/what-pills.png", alt: "Wegovy oral tablets" },
      { src: "/assets/wegovy/how-pill.png", alt: "Wegovy tablet close-up" },
      { src: "/assets/wegovy/what-snac.png", alt: "How the Wegovy tablet is absorbed" },
      { src: "/assets/wegovy/what-man.png", alt: "Man after weight-loss treatment" },
    ],
    discountBadge: "New",
    features: SHARED_FEATURES,
    dosages: [
      { label: "1.5 mg", perPack: "£149.00" },
      { label: "4 mg", perPack: "£149.00" },
    ],
    fromPrice: "£149.00",
    serviceChips: SHARED_SERVICE_CHIPS,
    trustLine: [
      "⭐⭐⭐⭐⭐ 4.4 Trustpilot",
      "UK-registered prescribers",
      "MHRA-approved treatment",
    ],
    whatIsTitle: "What is the Wegovy Pill?",
    whatIsBody:
      "The Wegovy® Pill is a <strong>once-daily oral form of semaglutide</strong> — the same GLP-1 active ingredient as the Wegovy injection — that works with your body's natural appetite signals to reduce hunger and support weight loss.",
    whatIsCallout:
      "The same trusted active ingredient, now without weekly injections.",
    whatIsBullets: [
      "Once-daily oral tablet — no needles",
      "Semaglutide, a proven GLP-1 receptor agonist",
      "MHRA-approved in the UK",
      "Clinician-led, medically supervised care",
    ],
    graph: {
      points: [
        { x: "Start",     weight: 100  },
        { x: "Month 4",   weight: 94   },
        { x: "Month 8",   weight: 90   },
        { x: "Month 12",  weight: 86.5 },
        { x: "Month 16",  weight: 83.4 },
      ],
      minWeight: 70,
      maxWeight: 100,
      yLabels: [100, 94, 88, 82, 76, 70],
      xLabels: ["Start", "Month 4", "Month 8", "Month 12", "Month 16"],
      callout: "-16.6%",
    },
    safetyTitle: "Is the Wegovy Pill safe?",
    safetyBody:
      "The Wegovy® Pill (oral semaglutide) is prescribed only after a clinical assessment by UK-registered prescribers and is monitored throughout your treatment. It isn't suitable for everyone — our clinicians review your medical history first.",
    safetySideEffects:
      "The most common side effects are gastrointestinal — nausea, diarrhoea, vomiting and constipation — and usually ease as your body adjusts. Our clinical team supports you throughout.",
    accordions: SHARED_ACCORDIONS,
    comparisonActive: "wegovyTablet",
    cardStat: {
      percent: "16.6%",
      text: "average body weight loss at 64 weeks for patients combining treatment with lifestyle changes.*",
    },
    cardBenefits: [
      "Once-daily oral tablet — no needles",
      "Same active ingredient as the Wegovy injection",
      "May help reduce appetite and cravings",
      "Clinician-led, medically supervised care",
    ],
  },
};

export const PDP_FAQS = SHARED_FAQS;
