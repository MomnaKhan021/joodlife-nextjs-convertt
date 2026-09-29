/**
 * Copy, images and links for the Foundayo landing page at /foundayo.
 *
 * Rebuilt from the "Foundayo Pill - Next Js" Figma (DpxIILKt2ILXaS3ksRHrop,
 * frame 1:1505 desktop + the mobile frame beside it). Kept in one file, in
 * page order, so the words can be checked and changed in one place. Client-
 * safe (no server imports).
 *
 * Regulated copy lives here: efficacy figures, MHRA status, dosing, pricing
 * and the safety notice. Change with care.
 */

export const FOUNDAYO_ASSESS = "/consultation?product=weight-loss";

const IMG = "/assets/foundayo";

export type FoundayoCard = { title: string; body: string; image: string; alt: string; badge?: { top: string; value: string } };
export type FoundayoRow = { label: string; mark: "check" | "minus" };
export type FoundayoDose = { mg: string; label: string; days: string; price: string; start: boolean };
export type FoundayoFaq = { q: string; a: string };

import type { UspIcon } from "@/lib/wegovyContentTypes";

export const FOUNDAYO = {
  announcement: { badge: "New Foundayo Pills", text: "treatment in the UK" },

  hero: {
    title: "Uk first.",
    titleAccent: "foundayo pills",
    subtitle: "A new way to lose weight",
    body: "Introducing Foundayo® in the UK, with clinician-led support tailored to you. A once-daily tablet. No needles, no fasting, no fridge. Just real results.",
    reviewsLabel: "4.4 (50+) Reviews",
    ctaLabel: "Get Foundayo Today",
    ctaHref: FOUNDAYO_ASSESS,
    image: `${IMG}/hero.jpg`,
    imageAlt: "Woman at home taking a Foundayo tablet with a glass of water",
    stats: [
      "12.4% average weight loss in 72 weeks",
      "MHRA approved for use in UK on 10 August 2026",
      "Once-daily oral orforglipron",
    ],
  },

  usp: [
    { label: "free next-day delivery", icon: "delivery" },
    { label: "clinically proven medication", icon: "medication" },
    { label: "Cancel anytime subscription", icon: "cancel" },
    { label: "Medical support", icon: "support" },
    { label: "Trusted by 100k UK customers", icon: "customers" },
  ] as { label: string; icon: UspIcon }[],

  whatIs: {
    heading: "What is",
    headingAccent: "foundayo pill?",
    ctaLabel: "Check Your Eligibility",
    ctaHref: FOUNDAYO_ASSESS,
    cards: [
      {
        title: "FDA Approved",
        body: "Foundayo™ is a prescription GLP-1 medication clinically studied for weight management.",
        image: `${IMG}/card-pills.jpg`,
        alt: "Foundayo tablets",
      },
      {
        title: "More Flexibility",
        body: "A once-daily oral GLP-1 pill with no injection and no strict food or water restrictions.",
        image: `${IMG}/hand-pill.webp`,
        alt: "Hand holding a Foundayo tablet",
      },
      {
        title: "Real results",
        body: "Clinical studies showed meaningful weight loss over time when combined with healthy lifestyle changes.",
        image: `${IMG}/card-results.webp`,
        alt: "Woman in activewear",
        badge: { top: "Year 1", value: "↓ 32 lbs" },
      },
      {
        title: "Weight-loss support",
        body: "Foundayo is prescribed alongside ongoing clinical support to help you stay on track.",
        image: `${IMG}/phone-man.webp`,
        alt: "Man smiling at his phone",
      },
    ] as FoundayoCard[],
  },

  comparison: {
    heading: "Foundayo pill vs",
    headingAccent: "Wegovy injection",
    pillTitle: "Foundayo Pill",
    penTitle: "Wegovy pen",
    pillPrice: { prefix: "Starting from ", amount: "£149/mo", suffix: " billed monthly, membership required*" },
    penPrice: { prefix: "Starting from ", amount: "£199/mo", suffix: " billed monthly, membership required*" },
    pillTaken: { label: "Taken", value: "Once daily" },
    penTaken: { label: "Taken", value: "Once weekly" },
    pillRows: [
      { label: "Orforglipron active ingredient", mark: "check" },
      { label: "Clinically proven", mark: "check" },
      { label: "Injection free", mark: "check" },
      { label: "No fasting required", mark: "check" },
    ] as FoundayoRow[],
    penRows: [
      { label: "Semaglutide active ingredient", mark: "check" },
      { label: "Clinically proven", mark: "check" },
      { label: "Injection free", mark: "minus" },
      { label: "No fasting required", mark: "minus" },
    ] as FoundayoRow[],
    footnote: "Foundayo Pill provides a convenient once-daily oral approach for weight management, offering an alternative to injectable treatment options.",
    ctaLabel: "Get Started",
    ctaHref: FOUNDAYO_ASSESS,
  },

  howItWorks: {
    heading: "How does",
    headingAccent: "foundayo work?",
    intro: "Foundayo contains orforglipron, a non-peptide GLP-1 receptor agonist. It works by mimicking the natural GLP-1 hormone found in your gut. The hormone's job is to help:",
    callouts: ["Quiet your\nfood noise", "Slow down\nyour digestion", "Regulate your blood\nsugar⁵", "Regulate your\nappetite⁴"],
    body: "Foundayo works on the same GLP-1 pathway as the weekly injections, but orforglipron is a small molecule rather than a peptide. That means it is absorbed straight from your gut — no protective coating, no empty stomach, no 30-minute wait. You can take it at any time of day, with or without food or water.",
    ctaLabel: "Get Started",
    ctaHref: FOUNDAYO_ASSESS,
    secondaryLabel: "Learn More",
    secondaryHref: "#faq",
    image: `${IMG}/how-pill.webp`,
  },

  reviews: {
    heading: "3000+ happy",
    headingAccent: "customers",
    intro: "Thousands of people trust Foundayo Pill as part of their medically supported weight management journey. Patients value the convenience of a once-daily tablet, expert healthcare guidance, and personalised support throughout their treatment.",
  },

  realResults: {
    heading: "Real results",
    headingAccent: "with Foundayo",
    statPrefix: "Up to",
    statValue: 12.4,
    statCaption: "average body weight loss at 72 weeks*",
    footnote: "*Based on ATTAIN-1, the manufacturer's 72-week phase 3 study in adults living with obesity, or with overweight and at least one weight-related medical problem. Alongside a reduced-calorie diet and increased physical activity, adults taking Foundayo® at the highest dose lost an average of 12.4% of body weight, compared with 0.9% for people taking placebo (not on medicine). Individual results vary.",
    anytimeTitle: "Any time of day",
    anytimeBody: "with or without food, water or a fridge",
    bokeh: `${IMG}/results-bokeh.jpg`,
    photo: `${IMG}/results-woman.jpg`,
    photoAlt: "Woman on a coastal path at sunset",
    overlayTitle: "Health gains beyond numbers",
    overlayBody: "Foundayo contains orforglipron, Eli Lilly's once-daily GLP-1 tablet. Alongside weight loss it helps stabilise blood sugar and supports your body's insulin response.",
  },

  dosing: {
    heading: "Foundayo pill",
    headingAccent: "dosing & pricing",
    body: "All prices include an initial order discount of £20, plus the £20 saving we provide to patients who sign up to one of our 6-month commit and save plans. Pricing of the higher 14.5mg and 17.2mg doses will be confirmed before those doses become available.",
    image: `${IMG}/hand-pill.webp`,
    imageAlt: "Hand holding a Foundayo tablet",
    startBadge: "Starting Dose",
    doses: [
      { mg: "0.8mg", label: "Starting Dose", days: "Days 1–30", price: "£149", start: true },
      { mg: "2.5mg", label: "Step-Up Dosing", days: "Days 31–60", price: "£149", start: false },
      { mg: "5.5mg", label: "Step-Up Dosing", days: "Days 61–90", price: "£299", start: false },
      { mg: "9mg", label: "Step-Up Dosing", days: "Days 91+", price: "£299", start: false },
    ] as FoundayoDose[],
    commitTitle: "Commit And Save Plan",
    commitBody: "sign up to a 6 month plan and we'll take £20 off every month",
    commitCta: "Get Started Today",
    commitHref: FOUNDAYO_ASSESS,
  },

  whyChoose: {
    heading: "Why choose jood life",
    headingAccent: "for foundayo",
    benefits: ["MHRA-approved prescription treatment", "UK-licensed prescribers", "24/7 care team support"],
    safety: "Foundayo is a prescription-only medicine. Do not take Foundayo if you are pregnant, planning a pregnancy or breastfeeding, if you have had a serious allergic reaction to orforglipron, or if you are already taking another GLP-1 medicine. Speak to your prescriber first if you have a history of pancreatitis, gallbladder or kidney problems, severe stomach-emptying problems, or diabetic retinopathy.",
    image: `${IMG}/why-man.jpg`,
    imageAlt: "Man walking along a riverside path in the city",
  },

  faq: {
    heading: "Frequently asked",
    headingAccent: "questions",
    items: [
      {
        q: "What is the Foundayo® Pill?",
        a: "Foundayo is a once-daily tablet containing orforglipron, a GLP-1 receptor agonist made by Eli Lilly. It works on the same appetite and blood-sugar pathway as the weekly injections, but as a small-molecule tablet rather than a peptide injection.",
      },
      {
        q: "How effective is Foundayo compared with the injections?",
        a: "In the manufacturer's 72-week ATTAIN-1 study, adults taking the highest dose of Foundayo alongside diet and activity changes lost an average of 12.4% of their body weight. Results vary between people, and your prescriber will help you choose the treatment that suits you best.",
      },
      {
        q: "Do I need to take it on an empty stomach?",
        a: "No. Unlike oral semaglutide, Foundayo has no food, water or timing restrictions — you can take it at any time of day, with or without food, and it does not need to be kept in the fridge.",
      },
      {
        q: "What are the side effects?",
        a: "The most common side effects are digestive — nausea, constipation, diarrhoea and vomiting — and usually ease as your body adjusts to each dose. Your care team is available throughout treatment if anything feels wrong.",
      },
      {
        q: "Can I switch from an injection to Foundayo?",
        a: "Often, yes. Switching is a clinical decision: your prescriber will review how you have responded to your current treatment and agree a safe starting dose of Foundayo with you.",
      },
      {
        q: "Is Foundayo available on the NHS?",
        a: "Jood is a private service, so Foundayo is paid for directly with clear monthly pricing — see the dosing and pricing section above. NHS availability is decided separately by NICE and local NHS bodies.",
      },
    ] as FoundayoFaq[],
  },

  finalCta: {
    heading: "Ready to start the",
    headingAccent: "Foundayo journey?",
    body: "A 2-minute clinical intake. No obligation. No payment until you're approved.",
    ctaLabel: "Get Started",
    ctaHref: FOUNDAYO_ASSESS,
    image: `${IMG}/cta-woman.webp`,
    imageAlt: "Woman looking up and smiling",
  },
};
