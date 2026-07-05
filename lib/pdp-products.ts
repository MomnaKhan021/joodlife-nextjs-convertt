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
  saxenda: string;
  /** Wegovy tablet column for the 3-product comparison table */
  wegovyTablet?: string;
};

export type PDPProduct = {
  slug: "mounjaro" | "wegovy" | "saxenda";
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
  comparisonActive: "mounjaro" | "wegovy" | "saxenda";
  /** Final-product-page card: a headline efficacy stat and a short
   * list of benefits, shown on the "Choose your treatment" cards. */
  cardStat?: { percent: string; text: string };
  cardBenefits?: string[];
};

const SHARED_COMPARISON: ComparisonRow[] = [
  { label: "How it's taken",           mounjaro: "Weekly injection",          wegovy: "Weekly injection",   saxenda: "Daily injection", wegovyTablet: "Daily tablet" },
  { label: "Frequency",                mounjaro: "Once weekly",               wegovy: "Once weekly",        saxenda: "Once daily",      wegovyTablet: "Once daily" },
  { label: "Active ingredient",        mounjaro: "Tirzepatide",               wegovy: "Semaglutide",        saxenda: "Liraglutide",     wegovyTablet: "Semaglutide" },
  { label: "Needle-free",              mounjaro: "❌",                        wegovy: "❌",                 saxenda: "❌",              wegovyTablet: "✅" },
  { label: "May help regulate appetite", mounjaro: "★★★★★",                  wegovy: "★★★★☆",             saxenda: "★★★☆☆",          wegovyTablet: "★★★★☆" },
  { label: "Feeling of fullness",      mounjaro: "Longer lasting",            wegovy: "Longer lasting",     saxenda: "Longer lasting",  wegovyTablet: "Longer lasting" },
  { label: "Convenience",              mounjaro: "★★★★★",                     wegovy: "★★★★★",             saxenda: "★★★★☆",          wegovyTablet: "★★★★★" },
  { label: "Best suited for",          mounjaro: "Maximum weight loss potential", wegovy: "Proven weekly treatment", saxenda: "Daily routine", wegovyTablet: "Needle-free treatment" },
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

  saxenda: {
    slug: "saxenda",
    title: "Saxenda",
    italicWord: "injection",
    ratingLabel: "4.5 Rated Excellence",
    lede:
      "Daily weight-loss support with Saxenda — A once-daily GLP-1 injection that helps reduce appetite and support gradual, sustainable weight loss alongside healthier habits.",
    gallery: [
      { src: "/assets/figma/pdp/saxenda-1.png", alt: "Saxenda injection pen on a beige background" },
      { src: "/assets/figma/pdp/saxenda-2.png", alt: "Saxenda injection pen close-up" },
      { src: "/assets/figma/pdp/saxenda-3.png", alt: "Person holding Saxenda" },
      { src: "/assets/figma/pdp/saxenda-4.png", alt: "Saxenda injection pen" },
    ],
    discountBadge: "10%",
    features: SHARED_FEATURES,
    dosages: [
      { label: "0.6 mg", perPack: "£75.00" },
      { label: "1.2 mg", perPack: "£105.00" },
      { label: "1.8 mg", perPack: "£135.00" },
      { label: "2.4 mg", perPack: "£165.00" },
      { label: "3.0 mg", perPack: "£199.00" },
    ],
    fromPrice: "£75.00",
    serviceChips: SHARED_SERVICE_CHIPS,
    trustLine: [
      "⭐⭐⭐⭐⭐ 4.4 Trustpilot",
      "Over 2,000 patients treated",
      "GPhC Registered Pharmacy",
    ],
    whatIsTitle: "What is Saxenda?",
    whatIsBody:
      "Saxenda (liraglutide) is a <strong>prescription-only daily weight-loss injection</strong> that mimics the GLP-1 hormone to help reduce hunger and support gradual weight loss alongside diet and exercise.",
    whatIsCallout:
      "Daily dosing offers tighter appetite control for people who prefer a regular daily routine.",
    whatIsBullets: [
      "Daily injection routine",
      "Gradual, sustainable weight loss",
      "Reduces hunger between meals",
      "Clinician-led, medically supervised treatment",
    ],
    graph: {
      points: [
        { x: "Start",    weight: 100 },
        { x: "Month 3",  weight: 96  },
        { x: "Month 4",  weight: 93  },
        { x: "Month 5",  weight: 91  },
        { x: "Month 6",  weight: 90  },
      ],
      minWeight: 70,
      maxWeight: 100,
      yLabels: [100, 94, 88, 82, 76, 70],
      xLabels: ["Start", "Month 3", "Month 4", "Month 5", "Month 6"],
      callout: "-10%",
    },
    safetyTitle: "Is Saxenda safe?",
    safetyBody:
      "Saxenda (liraglutide) has been approved for adult weight management. It is prescribed after a clinical assessment and your treatment is monitored throughout to keep you safe.",
    safetySideEffects:
      "Side effects can include nausea, low blood sugar, headache, diarrhoea, and tiredness. Your clinician will support you in managing these and adjusting the dose where needed.",
    accordions: SHARED_ACCORDIONS,
    comparisonActive: "saxenda",
    cardStat: {
      percent: "8–10%",
      text: "typical weight loss over a year for daily users who stay consistent with treatment.",
    },
    cardBenefits: [
      "Reduced appetite and cravings",
      "Flexible daily dosing routine",
      "Supports gradual, steady weight loss",
      "Clinician-led, medically supervised care",
    ],
  },
};

export const PDP_FAQS = SHARED_FAQS;
