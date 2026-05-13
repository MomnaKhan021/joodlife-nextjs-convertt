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
  /** Description for the "What is X?" section */
  whatIsTitle: string;       // "What is Mounjaro?"
  whatIsBody: string;        // HTML-flavoured: <strong>…</strong>
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
};

const SHARED_COMPARISON: ComparisonRow[] = [
  { label: "How often?",        mounjaro: "Weekly",      wegovy: "Weekly",          saxenda: "Daily" },
  { label: "Appetite control",  mounjaro: "Strong",      wegovy: "Moderate–strong", saxenda: "Moderate" },
  { label: "Typical results (1 year)", mounjaro: "≈20–27%", wegovy: "≈14–16%",      saxenda: "≈8–10%" },
  { label: "Fullness feeling",  mounjaro: "Longer-lasting", wegovy: "Longer-lasting", saxenda: "Shorter" },
  { label: "Fits busy routines",mounjaro: "★★★",        wegovy: "★★★",            saxenda: "★★" },
  { label: "Lifestyle impact",  mounjaro: "Minimal",     wegovy: "Low",             saxenda: "Higher" },
  { label: "Active ingredient", mounjaro: "Tirzepatide", wegovy: "Semaglutide",     saxenda: "Liraglutide" },
];

export const COMPARISON_TABLE = SHARED_COMPARISON;

const SHARED_FEATURES = [
  { icon: "consultation", label: "Online clinical consultation" },
  { icon: "personalized", label: "Personalized Medication" },
  { icon: "support",      label: "Ongoing medical support" },
  { icon: "checkin",      label: "Regular progress check-ins" },
];

const SHARED_SERVICE_CHIPS = [
  { icon: "truck",    label: "Next day delivery" },
  { icon: "shield",   label: "Standard UK Delivery" },
  { icon: "lock",     label: "Safe Payment" },
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
    title: "Mounjaro",
    italicWord: "injection",
    ratingLabel: "4.5 Rated Excellence",
    lede:
      "Sustainable weight loss with Mounjaro — Reduce appetite, support weight loss, and improve overall metabolic health with a once-weekly Mounjaro injection — prescribed and monitored by UK clinicians.",
    gallery: [
      { src: "/assets/figma/pdp/mounjaro-1.png", alt: "Jood Mounjaro injection pen on a lavender background" },
      { src: "/assets/figma/pdp/mounjaro-2.png", alt: "Mounjaro injection pen close-up" },
      { src: "/assets/figma/pdp/mounjaro-3.png", alt: "Woman holding the Mounjaro injection at her waist" },
      { src: "/assets/figma/pdp/mounjaro-4.png", alt: "Mounjaro injection pen on a desk" },
    ],
    discountBadge: "26%",
    features: SHARED_FEATURES,
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
    whatIsTitle: "What is Mounjaro?",
    whatIsBody:
      "Mounjaro (tirzepatide) is a <strong>prescription-only weight-loss medication</strong> available in the UK. It works by activating the body's natural GLP-1 and GIP hormones, helping to reduce appetite, increase feelings of fullness, and support steady, sustainable weight loss when used alongside lifestyle changes.",
    whatIsCallout:
      "Most patients experience reduced appetite and early weight loss within the first few months of treatment.",
    whatIsBullets: [
      "Reduced appetite and cravings",
      "Supports long-term weight management",
      "May improve metabolic health",
      "Clinician-led, medically supervised treatment",
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
  },

  wegovy: {
    slug: "wegovy",
    title: "Wegovy",
    italicWord: "injection",
    ratingLabel: "4.5 Rated Excellence",
    lede:
      "Sustainable weight loss with Wegovy — A clinically proven once-weekly GLP-1 injection that helps reduce appetite, support steady weight loss and improve long-term metabolic health.",
    gallery: [
      { src: "/assets/figma/pdp/wegovy-1.png", alt: "Wegovy injection pen on a soft background" },
      { src: "/assets/figma/pdp/wegovy-2.png", alt: "Wegovy injection pen close-up" },
      { src: "/assets/figma/pdp/wegovy-3.png", alt: "Person holding Wegovy" },
      { src: "/assets/figma/pdp/wegovy-4.png", alt: "Wegovy injection pen" },
    ],
    discountBadge: "20%",
    features: SHARED_FEATURES,
    dosages: [
      { label: "0.25 mg", perPack: "£70.00" },
      { label: "0.5 mg",  perPack: "£105.00" },
      { label: "1 mg",    perPack: "£160.00" },
      { label: "1.7 mg",  perPack: "£195.00" },
      { label: "2.4 mg",  perPack: "£240.00" },
    ],
    fromPrice: "£99.00",
    serviceChips: SHARED_SERVICE_CHIPS,
    whatIsTitle: "What is Wegovy?",
    whatIsBody:
      "Wegovy (semaglutide) is a <strong>prescription-only weight-loss medication</strong> available in the UK. It mimics the body's GLP-1 hormone to help control appetite and improve blood-sugar regulation, supporting steady weight loss alongside lifestyle changes.",
    whatIsCallout:
      "Many patients see meaningful appetite changes and weight loss within the first three months of treatment.",
    whatIsBullets: [
      "Helps control appetite and cravings",
      "Backed by large-scale clinical trials",
      "May support cardiovascular health",
      "Clinician-led, medically supervised treatment",
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
    safetyTitle: "Is Wegovy safe?",
    safetyBody:
      "Wegovy (semaglutide) is approved by the MHRA for chronic weight management. It is prescribed only after a clinical assessment to ensure it is appropriate for you, and your treatment is monitored throughout.",
    safetySideEffects:
      "Side effects can include nausea, vomiting, diarrhoea, constipation, and abdominal discomfort, usually mild and short-lived. Your clinician will help you manage these and adjust the dose if needed.",
    accordions: SHARED_ACCORDIONS,
    comparisonActive: "wegovy",
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
  },
};

export const PDP_FAQS = SHARED_FAQS;
